import os
import inspect

TEST_DAT_PATH = os.path.join(__path__[0], "input_data")
TMP_PATH = os.path.join(__path__[0], "tmp")
CASE_PATH = os.path.join(__path__[0], "input")
OUT_PATH = os.path.join(__path__[0], 'output')


def dat_path(file):
    return os.path.join(TEST_DAT_PATH, file)


def tmp_path(file):
    return os.path.join(TMP_PATH, file)


def case_path(file):
    return os.path.join(CASE_PATH, file)


def out_path(file):
    return os.path.join(OUT_PATH, file)