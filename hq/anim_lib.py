# Shared helpers for the secret-camo reveal animations (run inside Blender by the job watcher).
# Each job builds its own scene, renders a ~4 s clip to Documents\ashfall\hq\out and removes the scene again,
# so whatever file is open in Blender is left alone.
import bpy, math, os, random, colorsys
OUT = os.path.join(os.path.expanduser('~'), 'Documents', 'ashfall', 'hq', 'out'); os.makedirs(OUT, exist_ok=True)
FPS, FRAMES, W, H = 30, 120, 960, 540
ENGINES = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items]

def new_scene(name, world=(0.0, 0.0, 0.0)):
    sc = bpy.data.scenes.new('anim_' + name)
    sc.render.engine = 'BLENDER_EEVEE_NEXT' if 'BLENDER_EEVEE_NEXT' in ENGINES else ('BLENDER_EEVEE' if 'BLENDER_EEVEE' in ENGINES else sc.render.engine)
    sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = W, H, 100
    sc.render.fps = FPS; sc.frame_start, sc.frame_end = 1, FRAMES
    try: sc.eevee.taa_render_samples = 24
    except Exception: pass
    try: sc.eevee.use_bloom = True; sc.eevee.bloom_intensity = 0.08; sc.eevee.bloom_threshold = 0.9
    except Exception: pass
    try: sc.view_settings.view_transform = 'AgX' if 'AgX' in [e.identifier for e in sc.view_settings.bl_rna.properties['view_transform'].enum_items] else 'Filmic'
    except Exception: pass
    w = bpy.data.worlds.new('w_' + name); w.use_nodes = True; sc.world = w
    bg = w.node_tree.nodes.get('Background')
    if bg: bg.inputs[0].default_value = (*world, 1); bg.inputs[1].default_value = 1.0
    glow(sc)
    return sc

def glow(sc):
    # compositor fog glow (bloom) for Blender versions without Eevee bloom
    try:
        sc.use_nodes = True; nt = sc.node_tree
        for n in list(nt.nodes): nt.nodes.remove(n)
        rl = nt.nodes.new('CompositorNodeRLayers'); gl = nt.nodes.new('CompositorNodeGlare'); co = nt.nodes.new('CompositorNodeComposite')
        try: gl.glare_type = 'FOG_GLOW'
        except Exception: pass
        try: gl.threshold = 0.85; gl.size = 7
        except Exception: pass
        nt.links.new(rl.outputs[0], gl.inputs[0]); nt.links.new(gl.outputs[0], co.inputs[0])
    except Exception as e:
        print('no compositor glow:', e)

def link(sc, ob): sc.collection.objects.link(ob); return ob

def emis(name, col, strength=5.0):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree
    for n in list(nt.nodes): nt.nodes.remove(n)
    e = nt.nodes.new('ShaderNodeEmission'); o = nt.nodes.new('ShaderNodeOutputMaterial')
    e.inputs[0].default_value = (*col, 1); e.inputs[1].default_value = strength
    nt.links.new(e.outputs[0], o.inputs[0]); m['em'] = e.name
    return m

def solid(name, col, metal=0.0, rough=0.4, ecol=None, es=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes.get('Principled BSDF')
    b.inputs['Base Color'].default_value = (*col, 1); b.inputs['Metallic'].default_value = metal; b.inputs['Roughness'].default_value = rough
    if ecol:
        k = 'Emission Color' if 'Emission Color' in b.inputs else 'Emission'
        b.inputs[k].default_value = (*ecol, 1)
        if 'Emission Strength' in b.inputs: b.inputs['Emission Strength'].default_value = es
    return m

def em_node(m): return m.node_tree.nodes[m['em']]
def kf_strength(m, f, v): n = em_node(m); n.inputs[1].default_value = v; n.inputs[1].keyframe_insert('default_value', frame=f)
def kf_color(m, f, col): n = em_node(m); n.inputs[0].default_value = (*col, 1); n.inputs[0].keyframe_insert('default_value', frame=f)

def kf(ob, path, f, v):
    setattr(ob, path, v); ob.keyframe_insert(path, frame=f)

def mesh(sc, kind, name, mat=None, **kw):
    import bmesh
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    if kind == 'sphere': bmesh.ops.create_uvsphere(bm, u_segments=kw.get('seg', 24), v_segments=kw.get('rings', 12), radius=kw.get('r', 1))
    elif kind == 'ico': bmesh.ops.create_icosphere(bm, subdivisions=kw.get('sub', 1), radius=kw.get('r', 1))
    elif kind == 'cube': bmesh.ops.create_cube(bm, size=kw.get('s', 1))
    elif kind == 'plane':
        s = kw.get('s', 1) / 2; vs = [bm.verts.new(p) for p in ((-s, -s, 0), (s, -s, 0), (s, s, 0), (-s, s, 0))]; bm.faces.new(vs)
    elif kind == 'torus':
        R, r, seg, sides = kw.get('R', 1), kw.get('r', 0.05), kw.get('seg', 64), kw.get('sides', 10); arc = kw.get('arc', 1.0)
        rings = []
        n = seg if arc >= 1 else seg + 1
        for i in range(n):
            a = 2 * math.pi * arc * i / seg; ring = []
            for j in range(sides):
                b = 2 * math.pi * j / sides; d = R + r * math.cos(b)
                ring.append(bm.verts.new((d * math.cos(a), d * math.sin(a), r * math.sin(b))))
            rings.append(ring)
        for i in range(seg if arc >= 1 else seg):
            a, b2 = rings[i], rings[(i + 1) % len(rings)]
            for j in range(sides): bm.faces.new((a[j], a[(j + 1) % sides], b2[(j + 1) % sides], b2[j]))
    bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    if mat: me.materials.append(mat)
    return link(sc, ob)

def text(sc, body, mat, size=1.0, loc=(0, 0, 0), extrude=0.05):
    cu = bpy.data.curves.new('t_' + body, 'FONT'); cu.body = body; cu.align_x = 'CENTER'; cu.align_y = 'CENTER'
    cu.size = size; cu.extrude = extrude; cu.bevel_depth = 0.01; cu.space_character = 1.15
    ob = bpy.data.objects.new('t_' + body, cu); ob.data.materials.append(mat)
    ob.location = loc; ob.rotation_euler = (math.pi / 2, 0, 0)
    return link(sc, ob)

def camera(sc, loc=(0, -12, 0), look=(0, 0, 0), lens=35):
    cd = bpy.data.cameras.new('cam'); cd.lens = lens
    cam = link(sc, bpy.data.objects.new('cam', cd)); sc.camera = cam; aim(cam, loc, look); return cam

def aim(cam, loc, look):
    from mathutils import Vector
    cam.location = loc; d = Vector(look) - Vector(loc); cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()

def light(sc, kind='POINT', loc=(0, -3, 3), energy=500, col=(1, 1, 1)):
    ld = bpy.data.lights.new('l', kind); ld.energy = energy; ld.color = col
    lo = link(sc, bpy.data.objects.new('l', ld)); lo.location = loc; return lo

def ease_all(sc):
    for ob in sc.objects:
        for ad in [ob.animation_data, getattr(ob.data, 'animation_data', None) if ob.data else None]:
            if ad and ad.action:
                try:
                    for fc in ad.action.fcurves:
                        for k in fc.keyframe_points: k.interpolation = 'BEZIER'
                except Exception: pass

def title(sc, name, col, start=72):
    # the camo name: scales in with a flash, plus a small SECRET CAMO line
    tm = emis('tm_' + name, col, 0.0); t = text(sc, name, tm, size=1.1, loc=(0, -3.2, -0.2))
    kf(t, 'scale', start - 1, (0.6, 0.6, 0.6)); kf(t, 'scale', start + 10, (1.08, 1.08, 1.08)); kf(t, 'scale', FRAMES, (1.0, 1.0, 1.0))
    kf_strength(tm, start - 1, 0.0); kf_strength(tm, start + 4, 40.0); kf_strength(tm, start + 16, 9.0); kf_strength(tm, FRAMES, 8.0)
    sm = emis('sm_' + name, (1, 1, 1), 0.0); s = text(sc, 'SECRET CAMO', sm, size=0.28, loc=(0, -3.2, -1.05), extrude=0.0)
    kf_strength(sm, start + 6, 0.0); kf_strength(sm, start + 20, 3.0)
    return t

def render(sc, name):
    has_ff = bool(getattr(bpy.app.build_options, 'codec_ffmpeg', False))
    base = os.path.join(OUT, 'secret_' + name)
    if has_ff:
        sc.render.image_settings.file_format = 'FFMPEG'
        ff = sc.render.ffmpeg; ff.format = 'WEBM'; ff.codec = 'WEBM'
        try: ff.constant_rate_factor = 'HIGH'; ff.ffmpeg_preset = 'GOOD'
        except Exception: pass
        sc.render.filepath = base + '_'
    else:
        sc.render.image_settings.file_format = 'JPEG'; sc.render.image_settings.quality = 90
        os.makedirs(base, exist_ok=True); sc.render.filepath = os.path.join(base, 'f_####')
    bpy.ops.render.render(animation=True, scene=sc.name)
    open(base + '.done', 'w').write('ffmpeg' if has_ff else 'jpeg')

def cleanup(sc):
    objs = list(sc.objects)
    for ob in objs:
        d = ob.data; bpy.data.objects.remove(ob, do_unlink=True)
        try:
            if d is not None and d.users == 0:
                for coll in (bpy.data.meshes, bpy.data.curves, bpy.data.lights, bpy.data.cameras):
                    if d.name in coll and coll[d.name] == d: coll.remove(d); break
        except Exception: pass
    w = sc.world; bpy.data.scenes.remove(sc)
    if w and w.users == 0: bpy.data.worlds.remove(w)
    for m in list(bpy.data.materials):
        if m.users == 0: bpy.data.materials.remove(m)
