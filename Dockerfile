FROM node:6

MAINTAINER Chris Briggs "chris@jooldesign.co.uk"

RUN apt-get update && apt-get install -yqq supervisor cron

RUN mkdir -p /var/log/supervisor
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

COPY crontab /etc/cron.d/schedule.cron
RUN chmod 0644 /etc/cron.d/schedule.cron
RUN touch /var/log/cron.log

RUN /usr/bin/crontab /etc/cron.d/schedule.cron

COPY . /code
WORKDIR /code

RUN /usr/local/bin/npm install
RUN /usr/local/bin/npm run build:prod

# Start processes
CMD cron && tail -f /var/log/cron.log
