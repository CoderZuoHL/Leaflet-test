function bilinearInterpolation(width, height, knownPoints) {
  // 创建一个用于存储插值结果的矩阵  
  let matrix = Array.from({ length: height }, () => Array(width).fill(0));

  // 辅助函数，用于找到四个最近的已知点  
  function findNeighbors(x, y) {
    let neighbors = [];
    let minDistances = [];

    for (let point of knownPoints) {
      let [px, py, value] = point;
      let distance = Math.sqrt(Math.pow(x - px, 2) + Math.pow(y - py, 2));
      minDistances.push(distance);
    }

    minDistances.sort((a, b) => a - b);

    for (let i = 0; i < 4; i++) {
      let index = minDistances.indexOf(knownPoints[i].distance);
      neighbors.push(knownPoints[index]);
    }

    return neighbors;
  }

  // 双线性插值函数  
  function interpolate(x, y, neighbors) {
    let [topLeft, topRight, bottomLeft, bottomRight] = neighbors;

    // 计算水平插值  
    let left = (topRight.value - topLeft.value) * (x - topLeft.x) / (topRight.x - topLeft.x) + topLeft.value;
    let right = (bottomRight.value - bottomLeft.value) * (x - bottomLeft.x) / (bottomRight.x - bottomLeft.x) + bottomLeft.value;

    // 计算垂直插值  
    return (right - left) * (y - topLeft.y) / (bottomLeft.y - topLeft.y) + left;
  }

  // 遍历每个点并插值  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {

      // 判断遍历的点， 是否是已知点，
      if (!knownPoints.some(point => point[0] === x && point[1] === y)) {

        let neighbors = findNeighbors(x, y);
        if (neighbors.length === 4) { // 确保找到四个点  
          matrix[y][x] = interpolate(x, y, neighbors);
        }
      } else {
        matrix[y][x] = knownPoints.find(point => point[0] === x && point[1] === y)[2];
      }
    }
  }

  return matrix;
}

// 示例使用  
let width = 4;
let height = 4;
let knownPoints = [
  [0, 0, 10],
  [0, 3, 20],
  [3, 0, 30],
  [3, 3, 40]
];

let interpolatedMatrix = bilinearInterpolation(width, height, knownPoints);
console.log(interpolatedMatrix);
console.log(interpolatedMatrix[0][0]); // 输出插值结果