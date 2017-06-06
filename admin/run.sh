eval $(docker-machine env hikinghomeschoolers)
docker build -t jaybeavers/rudoneyet ..
docker stop rudoneyet
docker rm rudoneyet
docker rmi `docker images --filter 'dangling=true' -q --no-trunc`
docker run -d --name rudoneyet -e TRELLO_KEY -e TRELLO_SECRET -e "VIRTUAL_HOST=www.rudoneyet.com,rudoneyet.com" -e "LETSENCRYPT_HOST=www.rudoneyet.com,rudoneyet.com" -e "LETSENCRYPT_EMAIL=jay@hikinghomeschoolers.org" jaybeavers/rudoneyet
