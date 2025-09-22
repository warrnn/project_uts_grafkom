export class Object {
    GL = null;
    SHADER_PROGRAM = null;

    _position = null;
    _color = null;
    _Mmatrix = null;

    vertex = [];
    faces = [];

    OBJECT_VERTEX = null;
    OBJECT_FACES = null;

    MOVE_MATRIX = LIBS.get_I4();
    MODEL_MATRIX = LIBS.get_I4();

    childs = [];

    constructor(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, vertex = [], faces = []) {
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;

        this._position = _position;
        this._color = _color;
        this._Mmatrix = _Mmatrix;

        this.vertex = vertex;
        this.faces = faces;
    }

    setup() {
        // Setup vertex buffer
        this.OBJECT_VERTEX = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(this.vertex), this.GL.STATIC_DRAW);

        // Setup index buffer
        this.OBJECT_FACES = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
        this.GL.bufferData(this.GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.faces), this.GL.STATIC_DRAW);

        // Setup childs recursively
        this.childs.forEach(child => child.setup());
    }

    render(PARENT_MATRIX) {
        this.GL.useProgram(this.SHADER_PROGRAM);

        // MODEL_MATRIX = PARENT_MATRIX * MOVE_MATRIX
        this.MODEL_MATRIX = LIBS.multiply(PARENT_MATRIX, this.MOVE_MATRIX);

        // Set uniform
        this.GL.uniformMatrix4fv(this._Mmatrix, false, this.MODEL_MATRIX);

        // Bind buffers
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);

        this.GL.vertexAttribPointer(this._position, 3, this.GL.FLOAT, false, 4 * (3 + 3), 0);
        this.GL.vertexAttribPointer(this._color, 3, this.GL.FLOAT, false, 4 * (3 + 3), 4 * 3);

        // Draw
        this.GL.drawElements(this.GL.TRIANGLES, this.faces.length, this.GL.UNSIGNED_SHORT, 0);

        // Render childs recursively
        this.childs.forEach(child => child.render(this.MODEL_MATRIX));
    }

    addChild(child) {
        this.childs.push(child);
    }
}
