#!/bin/sh

# Download and install.
python3 -m venv venv
source venv/bin/activate
pip3 install -r requirements.txt
pip3 install gunicorn
flask db upgrade
flask translate compile

# Run the server.
python3 -m flask run &

# Run node Puppeteer/Lighthouse wrapper.
node bin/assignment-1/test.js

if [ $? -eq 0 ]
then
    ps auxwww | grep flask | awk '{print $2}' | xargs kill -9

    echo "Success!"
    exit 0
else
    ps auxwww | grep flask | awk '{print $2}' | xargs kill -9

    echo "Test failed; see the output above."
    exit 1
fi