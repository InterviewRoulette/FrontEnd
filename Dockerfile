# Docker image
FROM m13253/tornado

# Add files
ADD /front-end /front-end

# Set working directory
WORKDIR /front-end

# Expose port
EXPOSE 8888

# Run
CMD python3.5 main.py
