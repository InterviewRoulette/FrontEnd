FROM m13253/tornado

ADD /front-end /front-end

# Set working directory
WORKDIR /front-end

EXPOSE 8888

CMD python3.5 main.py
