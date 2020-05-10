function drawWebglCanvas(f, v, gl, image) {
	function resizeGlAndCanvas(gl) {
		resizeCanvas(gl);
		const resizeFunc = () => {
			resizeCanvas(gl);
		};
		const lazyFunc = debounce(resizeFunc, 20);
		window.addEventListener('resize', lazyFunc);
	}
	const vertexShader = createShader(gl, gl.VERTEX_SHADER, v);
	const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, f);
	const program = createProgram(gl, vertexShader, fragmentShader);


	// look up where the vertex data needs to go.
	var positionLocation = gl.getAttribLocation(program, "a_position");
	var texcoordLocation = gl.getAttribLocation(program, "a_texCoord");

	// Create a buffer to put three 2d clip space points in
	var positionBuffer = gl.createBuffer();

	// Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	// Set a rectangle the same size as the image.
	setRectangle(gl, 0, 0, image.width, image.height);

	// provide texture coordinates for the rectangle.
	var texcoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
		0.0,  0.0,
		1.0,  0.0,
		0.0,  1.0,
		0.0,  1.0,
		1.0,  0.0,
		1.0,  1.0,
	]), gl.STATIC_DRAW);

	var texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);

	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

	var resolutionLocation = gl.getUniformLocation(program, "u_resolution");

	gl.clearColor(0, 0, 0, 0);
	gl.clear(gl.COLOR_BUFFER_BIT);

	gl.useProgram(program);


	gl.enableVertexAttribArray(positionLocation);
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);


	gl.enableVertexAttribArray(texcoordLocation);
	gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
	gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);


	gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

	function render() {
		var primitiveType = gl.TRIANGLES;
		var offset = 0;
		var count = 6;
		gl.drawArrays(primitiveType, offset, count);
	}
}

function setRectangle(gl, x, y, width, height) {
	var x1 = x;
	var x2 = x + width;
	var y1 = y;
	var y2 = y + height;
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
		x1, y1,
		x2, y1,
		x1, y2,
		x1, y2,
		x2, y1,
		x2, y2,
	]), gl.STATIC_DRAW);
}

void async function getGlslAndDrawWebgl () {
	const fragment = await sendGetRequest('fragment.glsl'); // получаю текст из файла
	const vertex = await sendGetRequest('vertex.glsl'); // получаю текст из файла
	const canvas = document.querySelector('#glcanvas');
	const gl = initwebgl(canvas);
    if (!gl) {
		return;
	}
	const image = new Image();
	image.src = 'img.jpg';
	image.addEventListener('load', () => {
		drawWebglCanvas(fragment, vertex, gl, image);
	});
}();