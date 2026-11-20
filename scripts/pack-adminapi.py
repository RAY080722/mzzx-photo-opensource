# 打包 adminApi 云函数 zip（含 scf_bootstrap 可执行位，Windows 压缩工具会丢）
import os
import zipfile

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
fn = os.path.join(root, 'cloudfunctions', 'adminApi')
out = os.path.join(root, 'adminApi.zip')

with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
    for dirpath, _dirnames, filenames in os.walk(fn):
        for f in filenames:
            p = os.path.join(dirpath, f)
            zi = zipfile.ZipInfo(os.path.relpath(p, fn).replace(os.sep, '/'))
            zi.external_attr = (0o100755 if f == 'scf_bootstrap' else 0o644) << 16
            zi.compress_type = zipfile.ZIP_DEFLATED
            with open(p, 'rb') as fh:
                z.writestr(zi, fh.read())
print('packed', out, os.path.getsize(out), 'bytes')