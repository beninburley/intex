#!/usr/bin/env bash
# Place in .platform/hooks/postdeploy directory
sudo certbot -n -d http://group2-7turtleshelterv3.us-east-1.elasticbeanstalk.com/ --nginx --agree-tos --email benjaminahansen17@gmail.com