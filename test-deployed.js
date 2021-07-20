const http = require('http');
const fs = require('fs');
const path = require('path');

const server = new http.Server();
const webRoot = 'public';


server.on('request', handleRequest);
server.on('listening', () => console.log('Web server listening.'));
server.listen(8080);


function handleRequest(request, response)
{
	console.log(`Request for ${request.url}`);
	
	if(request.url == '/')
	{
		handleRequest({ url: 'index.html' }, response);
	}
	else
	{
		let filename = path.join(webRoot, request.url.substring(request.url.lastIndexOf('/') + 1));
		
		fs.readFile(filename, (error, data) =>
		{
			if(error)
			{
				console.log(`Error reading file ${filename}`);
				response.writeHead(404);
				response.end();
			}
			else
			{
				console.log(`Responding with ${data.length} bytes from ${filename}`);
				response.writeHead(200);
				response.end(data);
			}
		});
	}
}
