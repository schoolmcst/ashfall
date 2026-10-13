# Runs any job script dropped into Documents\ashfall\hq\jobs, so builds need no clicks in Blender.
import bpy, os, glob, traceback, io, contextlib
JOBS = os.path.join(os.path.expanduser('~'), 'Documents', 'ashfall', 'hq', 'jobs')
os.makedirs(JOBS, exist_ok=True)
def _ashfall_jobs():
    for f in sorted(glob.glob(os.path.join(JOBS, '*.py'))):
        run = f + '.running'
        try: os.replace(f, run)
        except Exception: continue
        buf = io.StringIO()
        try:
            with contextlib.redirect_stdout(buf):
                exec(compile(open(run).read(), f, 'exec'), {'__name__': '__main__'})
            status = 'OK\n'
        except Exception:
            status = 'ERROR\n' + traceback.format_exc()
        with open(f[:-3] + '.log', 'w') as fh: fh.write(status + buf.getvalue())
        try: os.replace(run, f + '.ran')
        except Exception: pass
    return 2.0
if not bpy.app.timers.is_registered(globals().get('_ashfall_jobs')):
    bpy.app.timers.register(_ashfall_jobs, first_interval=1.0, persistent=True)
print('ASHFALL job watcher running on', JOBS)
