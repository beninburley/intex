#!/usr/bin/env bash
# Place in .platform/hooks/postdeploy directory
sudo certbot -n -d group2-7turtleshelterv3.us-east-1.elasticbeanstalk.com -d group27.is404.net --nginx --agree-tos --email benjaminahansen17@gmail.com
