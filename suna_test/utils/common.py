#!/usr/bin/env python
# -*- coding:utf-8 -*-
# @Company:  Zeta Tech
# @Author:   Ben Qi
# @Datetime: 2025/03/22
# @Description: common utils
import os
import time
import json
import yaml
import numpy as np
import contextlib
from os import PathLike
from typing import Union, Type, Any, AnyStr, Optional


YamlLoaderType = Type[Union[yaml.BaseLoader, yaml.SafeLoader, yaml.FullLoader, yaml.UnsafeLoader, yaml.Loader]]


class Timer:

    def __init__(self, prefix, fmt="{prefix} time: {time:.6} s"):
        self.prefix = prefix
        self.fmt = fmt

    def __enter__(self):
        self.start = time.time()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        print(self.fmt.format(prefix=self.prefix, time=time.time() - self.start))


class WorkDirManager:

    def __init__(self, chdir):
        self.chdir = chdir

    def __enter__(self):
        self.owd = os.getcwd()
        os.chdir(self.chdir)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        os.chdir(self.owd)


def load_yaml(yaml_path: Union[str, PathLike], loader: YamlLoaderType = yaml.SafeLoader) -> Any:
    """
    Load YAML data from a file.

    Args:
        yaml_path (Union[str, PathLike]): YAML file path.
        loader (YamlLoaderType): Add the YAML filename to the YAML dictionary. Default is False.

    Returns:
        Any: YAML data.
    """
    with open(yaml_path, encoding='utf-8') as f:
        data = yaml.load(f, loader)
        return data


def load_json(json_path: Union[str, PathLike]) -> Any:
    """
    Load YAML data from a file.

    Args:
        json_path (Union[str, PathLike]): json file path.

    Returns:
        Any: json data.
    """
    with open(json_path, encoding='utf-8') as f:
        data = json.load(f)
        return data


def read_file(path: Union[str, PathLike]) -> AnyStr:
    """
    Read file data.
    Args:
        path(Union[str, PathLike]): file path

    Returns:
        AnyStr: file data
    """
    with open(path, encoding="utf-8") as f:
        return f.read()


def wait_read(
        file: Union[str, PathLike],
        times: int = 10, interval: float = 1, timeout: float = 10,
        terminator: Optional[str] = None
) -> Optional[AnyStr]:
    """
    Wait and read file data.

    Args:
        file: file path.
        times: number of attempts to read.
        interval: waiting interval time.
        timeout: waiting timeout period.
        terminator: terminator for verification. e.g. '\\n', 'OK'.

    Returns:
        Optional[str]: file data.
    """
    count = 0
    st = time.time()
    while count < times or time.time() - st < timeout:
        if os.path.exists(file):
            with contextlib.suppress(Exception):
                data = read_file(file)
            if terminator and not data.endswith(terminator):
                continue
            return data
        count += 1
        time.sleep(interval)
    return None


def load_config(config_path):
    """Load configuration from a JSON file."""
    with open(config_path, 'r', encoding='utf-8') as f:
        config = json.load(f)
    return config