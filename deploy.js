const fsPromises = require('fs').promises;
const path = require('path');

const targetDir = 'public';
const fileList = ['index.html', 'main.css', 'main.js', 'node_modules/vue/dist/vue.min.js'];

fsPromises.mkdir(targetDir, { recursive: true })
	.then(
		() => Promise.all(fileList.map( filename => fsPromises.copyFile(filename, path.join(targetDir, path.parse(filename).base)) ))
	);