function generateEllipsoid(rx = 1, ry = 1, rz = 1, stacks = 20, slices = 20, color = [1, 0, 0]) {
    let vertices = [];
    let indices = [];

    const rCol = color[0] ?? 1.0;
    const gCol = color[1] ?? 1.0;
    const bCol = color[2] ?? 1.0;

    // Generate vertices (posisi + warna tetap)
    for (let i = 0; i <= stacks; i++) {
        let theta = i * Math.PI / stacks; // 0 -> PI
        let sinTheta = Math.sin(theta);
        let cosTheta = Math.cos(theta);

        for (let j = 0; j <= slices; j++) {
            let phi = j * 2 * Math.PI / slices; // 0 -> 2PI
            let sinPhi = Math.sin(phi);
            let cosPhi = Math.cos(phi);

            // posisi
            let x = rx * sinTheta * cosPhi;
            let y = ry * cosTheta;
            let z = rz * sinTheta * sinPhi;

            // push posisi + warna custom
            vertices.push(x, y, z, rCol, gCol, bCol);
        }
    }

    // Generate indices
    for (let i = 0; i < stacks; i++) {
        for (let j = 0; j < slices; j++) {
            let first = i * (slices + 1) + j;
            let second = first + slices + 1;

            indices.push(first, second, first + 1);
            indices.push(second, second + 1, first + 1);
        }
    }

    return {
        vertices: new Float32Array(vertices),
        indices: new Uint16Array(indices)
    };
}

function generateCurvedCylinder(radiusStart = 0.2, radiusEnd = 0.1, length = 2.0, segments = 20, rings = 10, color = [1.0, 0.5, 0.0]) {
    let vertices = [];
    let indices = [];

    for (let i = 0; i <= segments; i++) {
        let t = i / segments;
        let r = radiusStart * (1 - t) + radiusEnd * t;  // radius mengecil ke ujung
        let y = -Math.sin(t * Math.PI / 2) * length;    // sedikit lengkung ke atas
        let z = -Math.cos(t * Math.PI / 2) * length;    // mundur ke belakang

        for (let j = 0; j <= rings; j++) {
            let theta = (j / rings) * 2 * Math.PI;
            let x = r * Math.cos(theta);
            let zOffset = r * Math.sin(theta);
            vertices.push(x, y, z + zOffset, ...color);
        }
    }

    for (let i = 0; i < segments; i++) {
        for (let j = 0; j < rings; j++) {
            let a = i * (rings + 1) + j;
            let b = a + rings + 1;
            let c = b + 1;
            let d = a + 1;
            // dua segitiga per face quad
            indices.push(a, b, d);
            indices.push(b, c, d);
        }
    }

    return { vertices, indices };
}
