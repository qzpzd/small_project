FROM zeta-adc-ccd-base:1.0.0

WORKDIR /app

RUN --mount=type=cache,target=/root/.cache/pip \
    --mount=type=bind,source=requirements.txt,target=requirements.txt \
    pip install -r requirements.txt -i https://mirrors.aliyun.com/pypi/simple
 
COPY [".", "/app"]

CMD ["python", "/app/ADC_main.py"]
