FROM cellofellow/ffmpeg

RUN apt-get update
RUN apt-get -y install sudo
RUN apt-get -y install python3
RUN apt-get -y install python-setuptools
RUN apt-get -y install postgresql
RUN apt-get -y build-dep python-psycopg2

# Install pip
RUN easy_install pip
RUN pip install momoko redis boto3

# Add files
ADD /front-end /front-end

# Set working directory
WORKDIR /front-end

# Expose port
EXPOSE 8888

# Run
CMD python main.py
