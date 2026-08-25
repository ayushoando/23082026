import pathlib
pathlib.Path('ltm/bin/ltm.py').write_text(pathlib.Path('ltm/bin/_ltm_src.py').read_text(), encoding='utf-8')
print('copied')
