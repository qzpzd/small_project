#!/usr/bin/env python
# -*- coding:utf-8 -*-
# @Company:  Zeta Tech
# @Author:   Ben Qi
# @Datetime: 2025/3/22
# @Description: virtualization utils

import os


def is_docker_env():
    """Is docker env?"""
    return os.path.isfile("/.dockerenv")


def is_kubernetes_env():
    """Is kubernetes env?"""
    return os.environ.get("KUBERNETES_SERVICE_HOST") is not None


def get_host_name_pid():
    """Get host name and pid."""
    # Get host name.
    host_name = os.environ.get("HOST_NAME") or os.environ.get("HOSTNAME")
    # Get the host PID corresponding to container PID 1.
    try:
        host_pid = int(os.environ.get("HOST_PID"))
    except:  # noqa
        host_pid = None
    return host_name, host_pid
