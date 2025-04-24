#!/usr/bin/env python
# -*- coding:utf-8 -*-
# @Company:  Zeta Tech
# @Author:   Ben Qi
# @Datetime: 2025/3/22
# @Description: log utils

import os
import re
import time
from pathlib import Path
import logging.config
from logging.handlers import TimedRotatingFileHandler
import portalocker
import warnings
from utils.common import yaml, load_yaml, WorkDirManager
from utils.virtualization import is_docker_env, get_host_name_pid

ROOT = Path(__file__).resolve().parent.parent


class SafeTimedRotatingFileHandler(TimedRotatingFileHandler):

    def doRollover(self):
        """
        do a rollover; in this case, a date/time stamp is appended to the filename
        when the rollover happens.  However, you want the file to be named for the
        start of the interval, not the current time.  If there is a backup count,
        then we have to get a list of matching filenames, sort them and remove
        the one with the oldest suffix.
        """
        if self.stream:
            self.stream.close()
            self.stream = None
        # get the time that this sequence started at and make it a TimeTuple
        currentTime = int(time.time())
        dstNow = time.localtime(currentTime)[-1]
        t = self.rolloverAt - self.interval
        if self.utc:
            timeTuple = time.gmtime(t)
        else:
            timeTuple = time.localtime(t)
            dstThen = timeTuple[-1]
            if dstNow != dstThen:
                if dstNow:
                    addend = 3600
                else:
                    addend = -3600
                timeTuple = time.localtime(t + addend)
        dfn = self.rotation_filename(self.baseFilename + "." +
                                     time.strftime(self.suffix, timeTuple))
        # Issue 18940: A file may not have been created if delay is True.
        if not os.path.exists(dfn) and os.path.exists(self.baseFilename):
            with open(self.baseFilename, 'a') as f:
                portalocker.lock(f.fileno(), portalocker.LOCK_EX)
                if not os.path.exists(dfn):
                    self.rotate(self.baseFilename, dfn)
                    if self.backupCount > 0:
                        for s in self.getFilesToDelete():
                            os.remove(s)
        if not self.delay:
            self.stream = self._open()
        newRolloverAt = self.computeRollover(currentTime)
        while newRolloverAt <= currentTime:
            newRolloverAt = newRolloverAt + self.interval
        # If DST changes and midnight or weekly rollover, adjust for this.
        if (self.when == 'MIDNIGHT' or self.when.startswith('W')) and not self.utc:
            dstAtRollover = time.localtime(newRolloverAt)[-1]
            if dstNow != dstAtRollover:
                if not dstNow:  # DST kicks in before next rollover, so we need to deduct an hour
                    addend = -3600
                else:  # DST bows out before next rollover, so we need to add an hour
                    addend = 3600
                newRolloverAt += addend
        self.rolloverAt = newRolloverAt


class LevelFilter(object):
    def __init__(self, levelno=logging.WARNING):
        """
        Initialize a match level filter.
        """
        self.levelno = levelno

    def filter(self, record):
        """
        Determine if the specified record is to be logged.
        """
        return record.levelno == self.levelno
    

def configure_logging(
    config_path=ROOT.joinpath("hyps/logging.yml"),
    configure_workdir=ROOT,
    disable_existing_loggers=None,
    subjoin_container_info=True,
    loader=yaml.SafeLoader
):
    """
    Configure logging.

    Args:
        config_path: logging config file path.
        configure_workdir: configure workdir.
        disable_existing_loggers: does disable existing loggers?
        subjoin_container_info: does subjoin container info?
        loader: YAML Loader

    Returns:
        bool: Success or not.
    """
    log_config = load_yaml(config_path, loader)
    if disable_existing_loggers is not None:
        log_config["disable_existing_loggers"] = disable_existing_loggers
    try:
        if is_docker_env() and subjoin_container_info:
            host_name, host_pid = get_host_name_pid()
            name_pattern = re.compile(r"\{\s*processName\s*(:((.?[<^=>])?[-+ ]?#?0?\d*[_,]?(\.\d+)?[bcdeEfFgGnos]?)?)?\}")  # noqa
            id_pattern = re.compile(r"\{\s*process\s*(:((.?[<^=>])?[-+ ]?#?0?\d*[_,]?(\.\d+)?[bcdeEfFgGnos]?)?)?\}")
            for _, formatter in log_config.get("formatters", {}).items():
                if "format" in formatter:
                    if host_name is not None:
                        formatter["format"] = name_pattern.sub(lambda x: f"[{host_name}] " + str(x.group()), formatter["format"])
                    if host_pid is not None:
                        formatter["format"] = id_pattern.sub(lambda x: str(x.group()) + f"({host_pid})", formatter["format"])
        with WorkDirManager(configure_workdir):
            for _, handler in log_config.get("handlers", {}).items():
                if filename := handler.get("filename"):
                    # 处理日期格式
                    filename = time.strftime(filename)
                    handler["filename"] = filename
                    Path(filename).parent.mkdir(parents=True, exist_ok=True)
            logging.config.dictConfig(log_config)
    except (KeyboardInterrupt, SystemExit):
        raise
    except Exception as e:  # noqa
        warnings.warn(f"Configure logging fail.", stacklevel=2)
        import traceback
        traceback.print_exc()
        return False
    return True
