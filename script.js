function sendGetRequest(url) {
	return fetch(url).then(response => {
		return response.text();
	});
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

let logger = (args) => console.log(args);
let throttledLogger = debounce(logger, 200);
window.addEventListener('resize', () => {
	throttledLogger(1);
});

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

function drawWebglCanvas(f, v, gl) {
	function renderGl(gl) {
		// gl.clearColor(0, 0, 0, 0);
		// gl.clear(gl.COLOR_BUFFER_BIT);
		gl.drawArrays(gl.TRIANGLES, 0, 3);
	}
	function resizeGlAndCanvas(gl) {
		resizeCanvas(gl);
		const resizeFunc = () => {
			resizeCanvas(gl);
			renderGl(gl);
		};
		const lazyFunc = debounce(resizeFunc, 10);
		window.addEventListener('resize', lazyFunc);
	}
	resizeGlAndCanvas(gl);
	const vertexShader = createShader(gl, gl.VERTEX_SHADER, v);
	const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, f);
	const program = createProgram(gl, vertexShader, fragmentShader);
	const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	const positions = new Float32Array([
		0, 0,
		0, 0.5,
		0.7, 0
	]);
	gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
	gl.clearColor(0, 0, 0, 0);
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.useProgram(program);
	gl.enableVertexAttribArray(positionAttributeLocation); // включаем атрибут
	// Привязываем буфер положений
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	
	// Указываем атрибуту, как получать данные от positionBuffer (ARRAY_BUFFER)
	const size = 2;          // 2 компоненты на итерацию
	const type = gl.FLOAT;   // наши данные - 32-битные числа с плавающей точкой
	const normalize = false; // не нормализовать данные
	const stride = 0;        // 0 = перемещаться на size * sizeof(type) каждую итерацию для получения следующего положения
	const offset = 0;        // начинать с начала буфера
	gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);

	const primitiveType = gl.TRIANGLES;
	const count = 3;
	gl.drawArrays(primitiveType, offset, count);
}

void async function () {
	const fragment = await sendGetRequest('fragment.glsl'); // получаю текст из файла
	const vertex = await sendGetRequest('vertex.glsl'); // получаю текст из файла
	// const fragment = document.querySelector('#fragment').innerHTML;
	// const vertex = document.querySelector('#vertex').innerHTML;
	const canvas = document.querySelector('#glcanvas');
	const gl = initwebgl(canvas);
    if (gl) {
		drawWebglCanvas(fragment, vertex, gl);
	}
}();