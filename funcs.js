function sendGetRequest(url) {
	return fetch(url).then(response => response.text());
}

function debounce(f, t) {
	return function (args) {
		let previousCall = this.lastCall;
		this.lastCall = Date.now();
		if (previousCall && ((this.lastCall - previousCall) <= t)) {
			clearTimeout(this.lastCallTimer);
		}
		this.lastCallTimer = setTimeout(() => f(args), t);
	}
}

function randomInt(range) {
	return Math.floor(Math.random() * range);
}

function initwebgl(canvas) {
	const context = canvas.getContext("webgl2") ||
	canvas.getContext("webgl") ||
	canvas.getContext("experimental-webgl");
	if (!context) {
		alert('У вас не поддерживается webgl, используйте новый Google Chrome');
	}
	return context;
}

function createShader(gl, type, source) {
	const shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	const sucess = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
	if (sucess) {
		return shader;
	}

	console.log(gl.getShaderInfoLog(shader));
	gl.deleteShader(shader);
}

function createProgram(gl, v, f) {
	const program = gl.createProgram();
	gl.attachShader(program, v);
	gl.attachShader(program, f);
	gl.linkProgram(program);
	const sucess = gl.getProgramParameter(program, gl.LINK_STATUS);
	if (sucess) {
		return program;
	}

	console.log(gl.getProgramInfoLog(program));
	gl.deleteProgram(program);
}

function resizeCanvas(gl) {
	const realToCSSPixels = window.devicePixelRatio; // для дисплеев повышенной четкости HD-DPI
	const width = Math.floor(gl.canvas.scrollWidth * realToCSSPixels);
	const height = Math.floor(gl.canvas.scrollHeight * realToCSSPixels);
	gl.canvas.width = width;
	gl.canvas.height = height;
	gl.viewport(0, 0, width, height);
}