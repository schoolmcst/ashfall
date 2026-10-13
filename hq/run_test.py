import bpy, json, os
out = os.path.join(os.path.expanduser('~'), 'Documents', 'ashfall', 'hq', 'run_test_out.json')
json.dump({'v': bpy.app.version_string, 'ok': True}, open(out, 'w'))
print('ASHFALL TEST OK', out)
