const http = require('http');
const fs = require('fs');
const server = new http.Server();

const resources = 
{
	'/': 'index.html',
	'/vue.js': 'node_modules/vue/dist/vue.js',
	'/vue.min.js': 'node_modules/vue/dist/vue.min.js',
	'/main.js': 'main.js',
	'/main.css': 'main.css',
};


server.on('request', handleRequest);
server.on('listening', () => console.log('Web server listening.'));
server.listen(8080);


function handleRequest(request, response)
{
	console.log(`Request for ${request.url}`);
	
	if(request.url in resources)
	{
		fs.readFile(resources[request.url], (error, data) =>
		{
			if(error)
			{
				console.log(`Error reading file ${resources[request.url]}`);
				response.writeHead(400);
				response.end();
			}
			else
			{
				console.log(`Responding with ${data.length} bytes.`);
				response.writeHead(200);
				response.end(data);
			}
		});
	}
	else
	{
		console.log(`${request.url} not found, sending 404.`);
		response.writeHead(404);
		response.end();
	}
}
