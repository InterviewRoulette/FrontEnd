# FrontEnd (InterviewRoulette)
Quick repo for a front end server

## Building

With docker installed and running, run

    docker build -t front-end .
to create the image. This may take some time for the first build, but will be fast once the core libraries have been downloaded.

Then use the following to run the server on port 80 locally (internally the server runs on port 8888)

    docker run -t -i -p 80:8888 front-end
Visit the address of your docker machine in the browser to view the application working. This is usually 192.168.99.100, but can be verified by running `docker-machine ip default`.
