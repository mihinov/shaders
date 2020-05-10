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
	const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
	const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	const positions = new Float32Array([
		10, 20,
		80, 20,
		10, 30,
		10, 30,
		80, 20,
		80, 30,
	]);
	gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
	resizeGlAndCanvas(gl);
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
	gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

	// указываем координаты текстуры для прямоугольника
	const texCoordLocation = gl.getAttribLocation(program, "a_texCoord");
	const texCoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
		0.0,  0.0,
		1.0,  0.0,
		0.0,  1.0,
		0.0,  1.0,
		1.0,  0.0,
		1.0,  1.0]), gl.STATIC_DRAW);
	gl.enableVertexAttribArray(texCoordLocation);
	gl.vertexAttribPointer(texCoordLocation, size, type, normalize, stride, offset);

	// создаём текстуру
	const texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);

	// задаём параметры, чтобы можно было отрисовать изображение любого размера
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	
	function render() {
		const primitiveType = gl.TRIANGLES;
		const offset = 0;
		const count = 6;
		gl.drawArrays(primitiveType, offset, count);
	}
	render();
}

function main() {
	const image = new Image();
	image.src = 'https://picsum.photos/200/300';
	image.addEventListener('load', () => {
		render(image);
	});
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
	image.src = 'https://picsum.photos/200/300';
	image.addEventListener('load', () => {
		drawWebglCanvas(fragment, vertex, gl, image);
	});
}();