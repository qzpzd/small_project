#!/usr/bin/env python
# -*- coding:utf-8 -*-
# @Company:  Zeta Tech
# @Author:   Ben Qi
# @Datetime: 2025/03/22
# @Description: config

from pathlib import Path
import yaml
from utils.common import load_yaml

ROOT = Path(__file__).resolve().parent.parent


def get_server_info(cfg_path=ROOT.joinpath("hyps/server.yml")):
    """获取服务器配置文件信息"""
    return load_yaml(cfg_path)
