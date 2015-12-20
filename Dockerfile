FROM m13253/tornado

ADD /front-end /front-end

# Install pip
RUN easy_install pip

# Install Python modules
RUN pip install -r /front-end/requirements.txt

# Set working directory
WORKDIR /front-end

EXPOSE 8888

CMD python3.5 main.py
