# ASHFALL HQ gun library: realistic part builders. Run inside Blender (via the R() helper).
# Game coordinates: x right, y up, -z toward the muzzle. Blender: bx = gx, by = -gz, bz = gy.
import bpy, bmesh, json, math, os
from mathutils import Vector, Matrix

HQ = os.path.join(os.path.expanduser('~'), 'Documents', 'ashfall', 'hq')
OUT = os.path.join(HQ, 'out'); PREV = os.path.join(HQ, 'previews')
for d in (OUT, PREV): os.makedirs(d, exist_ok=True)

# preview colours (the game uses its own materials keyed by these names)
MATCOL = {'metal': ((0.035, 0.037, 0.04), 0.85, 0.42), 'steel': ((0.16, 0.17, 0.18), 0.95, 0.3), 'poly': ((0.018, 0.018, 0.02), 0.0, 0.6),
          'wood': ((0.22, 0.09, 0.035), 0.0, 0.5), 'brass': ((0.6, 0.42, 0.12), 1.0, 0.3), 'tan': ((0.32, 0.26, 0.17), 0.0, 0.7),
          'od': ((0.12, 0.13, 0.08), 0.0, 0.7), 'grey': ((0.11, 0.115, 0.12), 0.6, 0.45), 'rubber': ((0.01, 0.01, 0.01), 0.0, 0.9),
          'lens': ((0.05, 0.1, 0.12), 0.5, 0.05)}

def clear():
    for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
    for c in list(bpy.data.collections): bpy.data.collections.remove(c)
    for m in list(bpy.data.meshes): bpy.data.meshes.remove(m)

def mat(k):
    m = bpy.data.materials.get('hq_' + k)
    if not m:
        m = bpy.data.materials.new('hq_' + k); m.use_nodes = True
        col, met, rough = MATCOL[k]
        b = next((nd for nd in m.node_tree.nodes if nd.type == 'BSDF_PRINCIPLED'), None)
        if b:
            b.inputs['Base Color'].default_value = (*col, 1); b.inputs['Metallic'].default_value = met; b.inputs['Roughness'].default_value = rough
        m.diffuse_color = (*col, 1)
    return m

def g2b(x, y, z): return Vector((x, -z, y))

class Gun:
    """Collects parts. Each object is named part__mat__n. Parts other than 'body' are exported relative to their pivot."""
    def __init__(self, gid):
        clear(); self.id = gid; self.n = 0; self.pivots = {}; self.anch = {}
        self.col = bpy.data.collections.new(gid); bpy.context.scene.collection.children.link(self.col)
        self.part = 'body'
    def use(self, part, pivot=None):
        self.part = part
        if pivot is not None: self.pivots[part] = list(pivot)
        return self
    def add(self, me, m, bevel=0.0, segs=2, angle=35, loc=None, rot=None):
        self.n += 1
        o = bpy.data.objects.new('%s__%s__%d' % (self.part, m, self.n), me)
        o.data.materials.append(mat(m))
        if loc is not None: o.location = loc
        if rot is not None: o.rotation_euler = rot
        if bevel > 0:
            md = o.modifiers.new('bv', 'BEVEL'); md.width = bevel; md.segments = segs; md.limit_method = 'ANGLE'; md.angle_limit = math.radians(angle); md.harden_normals = False
        self.col.objects.link(o)
        return o

    # ---------------- primitives
    def prof(self, m, pts, thick, x=0.0, bevel=0.0015, segs=3, angle=35):
        """side silhouette: pts are (z, y) in game coords, extruded across x (centred on x)"""
        me = bpy.data.meshes.new('p'); bm = bmesh.new()
        h = thick / 2
        a = [bm.verts.new(g2b(x - h, y, z)) for z, y in pts]
        b = [bm.verts.new(g2b(x + h, y, z)) for z, y in pts]
        n = len(pts)
        bm.faces.new(a[::-1]); bm.faces.new(b)
        for i in range(n):
            j = (i + 1) % n; bm.faces.new((a[i], a[j], b[j], b[i]))
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        bm.to_mesh(me); bm.free()
        return self.add(me, m, bevel, segs, angle)
    def prism(self, m, xy, z0, z1, bevel=0.0012, segs=2, angle=35, x=0.0, y=0.0):
        """cross-section xy (game x, y) swept along game z from z0 to z1"""
        me = bpy.data.meshes.new('q'); bm = bmesh.new()
        a = [bm.verts.new(g2b(x + px, y + py, z0)) for px, py in xy]
        b = [bm.verts.new(g2b(x + px, y + py, z1)) for px, py in xy]
        n = len(xy)
        bm.faces.new(a); bm.faces.new(b[::-1])
        for i in range(n):
            j = (i + 1) % n; bm.faces.new((a[i], b[i], b[j], a[j]))
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        bm.to_mesh(me); bm.free()
        return self.add(me, m, bevel, segs, angle)
    def box(self, m, size, center, bevel=0.0008, rx=0.0, ry=0.0, rz=0.0):
        w, h, d = size; cx, cy, cz = center
        me = bpy.data.meshes.new('b'); bm = bmesh.new()
        bmesh.ops.create_cube(bm, size=1.0)
        for v in bm.verts: v.co.x *= w; v.co.y *= d; v.co.z *= h
        bm.to_mesh(me); bm.free()
        return self.add(me, m, bevel, 2, 40, loc=g2b(cx, cy, cz), rot=(rx, -rz, ry))
    def lathe(self, m, zr, x=0.0, y=0.0, seg=24, bevel=0.0, cap=True):
        """revolve (z, r) pairs around an axis parallel to game z through (x, y)"""
        me = bpy.data.meshes.new('l'); bm = bmesh.new()
        rings = []
        for z, r in zr:
            ring = []
            for k in range(seg):
                a = k / seg * math.tau
                ring.append(bm.verts.new(g2b(x + math.cos(a) * r, y + math.sin(a) * r, z)))
            rings.append(ring)
        for i in range(len(rings) - 1):
            A, B = rings[i], rings[i + 1]
            for k in range(seg):
                l = (k + 1) % seg; bm.faces.new((A[k], A[l], B[l], B[k]))
        if cap:
            bm.faces.new(rings[0][::-1]); bm.faces.new(rings[-1])
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        bm.to_mesh(me); bm.free()
        return self.add(me, m, bevel, 1, 30)
    def tube(self, m, r, z0, z1, x=0.0, y=0.0, seg=20, r1=None):
        return self.lathe(m, [(z0, r), (z1, r if r1 is None else r1)], x, y, seg)
    def xcyl(self, m, r, length, center, seg=12):
        """pin / screw head lying across x"""
        cx, cy, cz = center
        me = bpy.data.meshes.new('c'); bm = bmesh.new()
        bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r, depth=length)
        bm.to_mesh(me); bm.free()
        return self.add(me, m, 0, loc=g2b(cx, cy, cz), rot=(0, math.pi / 2, 0))
    def ycyl(self, m, r, length, center, seg=14, r2=None):
        cx, cy, cz = center
        me = bpy.data.meshes.new('c'); bm = bmesh.new()
        bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r if r2 is None else r2, depth=length)
        bm.to_mesh(me); bm.free()
        return self.add(me, m, 0, loc=g2b(cx, cy, cz))

    # ---------------- common assemblies
    def rail(self, z0, z1, y, w=0.0212, m='metal', x=0.0, side=0):
        """picatinny rail: base + cross slots. side: 0 top, 1 right, -1 left (rotated)"""
        L = z0 - z1
        if side == 0:
            self.prism(m, [(-w / 2, 0), (w / 2, 0), (w / 2 + 0.002, 0.004), (w / 2 - 0.001, 0.0085), (-w / 2 + 0.001, 0.0085), (-w / 2 - 0.002, 0.004)], z1, z0, 0.0004, 1, x=x, y=y)
            n = int(L / 0.01)
            for i in range(n):
                self.box('poly' if m != 'poly' else 'metal', (w + 0.005, 0.003, 0.0045), (x, y + 0.0072, z0 - 0.005 - i * 0.01), 0)
        else:
            s = side
            self.prism(m, [(0, -w / 2), (0, w / 2), (s * 0.0085, w / 2 - 0.001), (s * 0.0085, -w / 2 + 0.001)], z1, z0, 0.0004, 1, x=x, y=y)
            n = int(L / 0.01)
            for i in range(n):
                self.box('poly', (0.003, w + 0.004, 0.0045), (x + s * 0.0072, y, z0 - 0.005 - i * 0.01), 0)
    def screw(self, x, y, z, r=0.0022, m='steel'):
        self.xcyl(m, r, 0.0016, (x, y, z), 10)

    # ---------------- export
    def save(self, preview=None):
        if preview is None: preview = globals().get('PREVIEW', False)
        data = {'parts': {}, 'pivots': self.pivots, 'anch': self.anch}
        dg = bpy.context.evaluated_depsgraph_get()
        groups = {}
        for o in self.col.objects:
            part, m, _ = o.name.split('__'); groups.setdefault((part, m), []).append(o)
        tris = 0
        for (part, m), objs in groups.items():
            piv = self.pivots.get(part, [0, 0, 0])
            g = export_group(objs, dg, piv); tris += len(g['i']) // 3
            data['parts'].setdefault(part, {})[m] = g
        data['tris'] = tris
        with open(os.path.join(OUT, self.id + '.json'), 'w') as fh: json.dump(data, fh, separators=(',', ':'))
        if preview: render_preview(self)
        print('HQ', self.id, 'tris', tris)
        return tris

def corner_normals(me, angle=math.radians(34)):
    by_vert = {}
    for p in me.polygons:
        for vi in p.vertices: by_vert.setdefault(vi, []).append(p)
    cosA = math.cos(angle); out = {}
    for p in me.polygons:
        pn = p.normal
        for li, vi in zip(p.loop_indices, p.vertices):
            acc = Vector((0, 0, 0))
            for q in by_vert[vi]:
                if q.normal.dot(pn) >= cosA: acc += q.normal * max(q.area, 1e-12)
            out[li] = acc.normalized() if acc.length > 1e-12 else pn.copy()
    return out

def export_group(objs, dg, piv):
    pos, nor, idx, lut = [], [], [], {}
    px, py, pz = piv
    for o in objs:
        oe = o.evaluated_get(dg); me = oe.to_mesh(); mw = o.matrix_world; mn = mw.to_3x3()
        cn = corner_normals(me); me.calc_loop_triangles()
        for t in me.loop_triangles:
            for li, vi in zip(t.loops, t.vertices):
                w = mw @ me.vertices[vi].co; n = (mn @ cn[li]).normalized()
                gp = (round((w.x - px) * 4000), round((w.z - py) * 4000), round((-w.y - pz) * 4000))
                gn = (round(n.x * 127), round(n.z * 127), round(-n.y * 127))
                key = gp + gn; k = lut.get(key)
                if k is None: k = len(pos) // 3; lut[key] = k; pos.extend(gp); nor.extend(gn)
                idx.append(k)
        oe.to_mesh_clear()
    return {'p': pos, 'n': nor, 'i': idx}

def render_preview(gun):
    sc = bpy.context.scene
    sc.render.engine = 'BLENDER_EEVEE' if 'BLENDER_EEVEE' in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items] else sc.render.engine
    sc.render.resolution_x, sc.render.resolution_y = 1400, 560
    sc.render.film_transparent = False
    w = sc.world or bpy.data.worlds.new('W'); sc.world = w; w.use_nodes = True
    bg = w.node_tree.nodes.get('Background')
    if bg: bg.inputs[0].default_value = (0.08, 0.085, 0.09, 1); bg.inputs[1].default_value = 1.0
    # bounds
    mn = Vector((1e9, 1e9, 1e9)); mx = -mn
    for o in gun.col.objects:
        for c in o.bound_box:
            v = o.matrix_world @ Vector(c); mn = Vector(map(min, mn, v)); mx = Vector(map(max, mx, v))
    ctr = (mn + mx) / 2; size = max(mx.y - mn.y, (mx.z - mn.z) * 2.5)
    cam_d = bpy.data.cameras.new('cam'); cam_d.type = 'ORTHO'; cam_d.ortho_scale = size * 1.08
    cam = bpy.data.objects.new('cam', cam_d); bpy.context.scene.collection.objects.link(cam)
    cam.location = ctr + Vector((1.5, 0, 0)); cam.rotation_euler = (math.pi / 2, 0, math.pi / 2)
    sc.camera = cam
    lights = []
    for loc, e in (((1.0, -0.5, 0.9), 220), ((0.9, 0.9, 0.2), 90), ((-0.8, 0.2, 1.0), 160)):
        ld = bpy.data.lights.new('l', 'AREA'); ld.energy = e; ld.size = 1.2
        lo = bpy.data.objects.new('l', ld); lo.location = ctr + Vector(loc); bpy.context.scene.collection.objects.link(lo)
        tr = lo.constraints.new('TRACK_TO'); tr.target = cam; tr.track_axis = 'TRACK_NEGATIVE_Z'
        lo.constraints.remove(tr); d = ctr - lo.location; lo.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
        lights.append(lo)
    sc.render.filepath = os.path.join(PREV, gun.id + '.png')
    bpy.ops.render.render(write_still=True)
    # 3/4 view
    cam_d.type = 'PERSP'; cam_d.lens = 70
    cam.location = ctr + Vector((size * 1.5, size * 1.15, size * 0.6)); d = ctr - cam.location; cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    sc.render.filepath = os.path.join(PREV, gun.id + '_34.png')
    bpy.ops.render.render(write_still=True)
    for o in [cam] + lights: bpy.data.objects.remove(o, do_unlink=True)
