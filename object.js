export class Object {
    GL = null;
    SHADER_PROGRAM = null;

    _position = null;
    _color = null;
    _Mmatrix = null; // Model Matrix

    OBJECT_VERTEX = null;
    OBJECT_FACES = null;

    vertex = [];
    faces = [];
    POSITION_MATRIX = LIBS.get_I4();
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
        this.OBJECT_VERTEX = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(this.vertex), this.GL.STATIC_DRAW);

        this.OBJECT_FACES = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
        this.GL.bufferData(this.GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.faces), this.GL.STATIC_DRAW);

        this.childs.forEach(child => {
            child.setup();
        })
    }

    render(PARENT_MATRIX) {
        this.GL.useProgram(this.SHADER_PROGRAM);

        this.MODEL_MATRIX = LIBS.multiply(PARENT_MATRIX, this.POSITION_MATRIX);
        this.MODEL_MATRIX = LIBS.multiply(this.MODEL_MATRIX, this.MOVE_MATRIX);

        this.GL.uniformMatrix4fv(this._Mmatrix, false, this.MODEL_MATRIX);

        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);

        this.GL.vertexAttribPointer(this._position, 3, this.GL.FLOAT, false, 4 * (3 + 3), 0);
        this.GL.vertexAttribPointer(this._color, 3, this.GL.FLOAT, false, 4 * (3 + 3), 4 * 3);

        this.GL.drawElements(this.GL.TRIANGLES, this.faces.length, this.GL.UNSIGNED_SHORT, 0);

        this.childs.forEach(child => {
            child.render(this.MODEL_MATRIX);
        })
    }
}