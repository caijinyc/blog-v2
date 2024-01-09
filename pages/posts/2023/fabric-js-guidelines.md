---
title: 实现 Figma 的辅助线功能
date: 2022/08/26

description: 最近给 fabric.js 写了一个辅助线功能，效果大概和 Figma 差不多，感觉挺有意思，本文简单总结一下。
tag: fabric.js
author: Jin
---

# 实现 Figma 的辅助线功能

最近给 [fabric.js](http://fabricjs.com/) 写了一个辅助线功能，效果大概和 Figma 差不多，感觉挺有意思，本文简单总结一下。

本文虽然是讲解如何在 fabric.js 上绘制辅助线，但是原理和在 DOM 上绘制辅助线是相同的。只要你想实现辅助线就可以参考本文进行实现。

fabric.js 是一个 Canvas 封装库，可以让我们快速实现一个 Canvas 图文编辑器，如图所示：

![https://jsd.cdn.zzko.cn/gh/caijinyc/images@main/picx/Untitled.13vmdv7nww2o.webp](https://jsd.cdn.zzko.cn/gh/caijinyc/images@main/picx/Untitled.13vmdv7nww2o.webp)

## 如何在画板上绘制辅助线

fabric.js 是基于 Canvas，所以很自然的可以想到，使用 Canvas 的 API 来绘制辅助线。

最终实现代码长这样（根据两个点来绘制一条辅助线）：

```jsx
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const aligningLineWidth = 1
const aligningLineColor = '#ff0000'

function drawLine(x1, y1, x2, y2) {
  ctx.save()
  ctx.lineWidth = aligningLineWidth
  ctx.strokeStyle = aligningLineColor
  ctx.beginPath()
  ctx.moveTo(
    x1,
    y1
  )
  ctx.lineTo(
    x2,
    y2
  )
  // 绘制
  ctx.stroke()
  ctx.restore()
}

drawLine(0, 0, 150, 150)

```

如果不是 Canvas 画布，那就直接用 DOM 进行绘制就可以了，没有什么区别。

## 判断何时需要绘制辅助线

辅助线的逻辑我们参考 Figma，先简单看一下它的辅助线逻辑：

辅助线分为 **垂直方向** 的辅助线和 **水平方向** 的辅助线，他们的逻辑是差不多的，先来讲一下**水平方向**的辅助线。

我们可以发现被拖拽的对象的 5 个锚点（绿色标记点）都需要进行辅助线绘制：

![https://jsd.cdn.zzko.cn/gh/caijinyc/images@main/picx/Untitled-1.4rtiwvtx0ec0.webp](https://jsd.cdn.zzko.cn/gh/caijinyc/images@main/picx/Untitled-1.4rtiwvtx0ec0.webp)

当我们对元素进行拖拽时，只要被拖拽元素的锚点和其他元素锚点在水平方向上相等时，就可以进行辅助线绘制。

```jsx
// 5 个锚点的数据模型

interface Point {
  x: number;
  y: number;
}

interface Coords {
  topLeft: Point;
  topRight: Point;
  center: Point;
  bottomLeft: Point;
  bottomRight: Point;
}

```

所以我们只需要拿到所有锚点的位置，就可以很简单的计算出需要绘制的辅助线。最简单的代码如下：

```jsx
// 遍历所有对象
for (let i = canvasObjects.length; i--; ) {

  // 遍历被 **拖拽对象** 的 **所有锚点**
  Keys(draggingObjCoords).forEach((draggingObjPoint) => {

    const objCoords = getObjCoords(canvasObjects[i]);
    // 遍历 **被遍历对象** 的 **所有锚点**
    Keys(objCoords).forEach((objPoint) => {

      // 判断两个锚点的水平坐标 Y 是否相等
      if (draggingObjCoords[activeObjPoint].y, objCoords[objPoint].y) {

        const y = objCoords[objPoint].y;

        // 计算辅助线的头尾的坐标
        let x1 = Math.min(objCoords[objPoint].x, draggingObjCoords[draggingObjPoint].x);
        let x2 = Math.max(objCoords[objPoint].x, draggingObjCoords[draggingObjPoint].x);

        horizontalLines.push({ y, x1, x2 });
      };

    });

  });

}

horizontalLines.forEach(line => drawHorizontalLine(line))

```

伪代码如下：

```jsx
// 遍历画布中的 **所有对象**
for ( ... ) {

   // 遍历 **被拖拽对象** 的 **所有锚点**
	 for ( ... ) {

     // 遍历 **被遍历对象** 的 **所有锚点**
     for (...) {

        // 判断两个锚点的 Y 轴是否相等
        if ( ... ) {

           // 计算辅助线位置
           const xLeft = Math.min( ... )
	         const xRight = Math.max( ... )

           // 绘制辅助线
           drawLine( ... )
        }

     }

   }

}

```

思路就是使用被拖拽元素的 5  个锚点和其他对象的锚点进行对比，当锚点之间的 Y 轴位置相等时，就可以绘制水平方向的辅助线了。

辅助线的样式和位置就需要根据业务之间的不同来进行调整了，我这里是参照 Figma 的辅助线位置来实现的。

![https://jsd.cdn.zzko.cn/gh/caijinyc/images@main/picx/Untitled-2.5hhif0p40ds0.webp](https://jsd.cdn.zzko.cn/gh/caijinyc/images@main/picx/Untitled-2.5hhif0p40ds0.webp)

例如这张截图，绘制了两根辅助线（灰色模块有两个锚点和被拖拽模块 Y 轴相等），通过 `Math.max` 和 `Math.min` 就可以计算出需要绘制的复制线的左右位置。

现在我们就能绘制出基本的辅助线了，但是细品 Figma 之后发现，当对象（非被拖拽的对象）被旋转后，他的对齐点就发生变化。

### 特殊情况1：遍历的元素被旋转时

![https://jsd.cdn.zzko.cn/gh/caijinyc/images@main/picx/Untitled-3.5zgio1yq34w0.webp](https://jsd.cdn.zzko.cn/gh/caijinyc/images@main/picx/Untitled-3.5zgio1yq34w0.webp)

只剩下中心点和最上、下的两个点（绿色标出），所以这里就需要我们进行特殊处理，也就是找到这两个点。

我们可以通过遍历所有的锚点，判断他们的 Y 轴值，来确定这两个点。

顺便说一下为什么元素被旋转只后生效的锚点少了：当元素过多时，画太多的辅助线反而不是什么好的体验，因为辅助线伴随着自动吸附，辅助线过多之后对用户的编辑体验有反向的影响。

### 特殊情况2：中心点对齐（红色为拖拽元素）

![https://jsd.cdn.zzko.cn/gh/caijinyc/images@main/picx/Untitled-4.56ej9xobeoc0.webp](https://jsd.cdn.zzko.cn/gh/caijinyc/images@main/picx/Untitled-4.56ej9xobeoc0.webp)

![https://jsd.cdn.zzko.cn/gh/caijinyc/images@main/picx/Untitled-5.6dfv71restc0.webp](https://jsd.cdn.zzko.cn/gh/caijinyc/images@main/picx/Untitled-5.6dfv71restc0.webp)

这个是 figma 居中对齐的效果图，我们发现，当对齐锚点为中心点时，辅助线的位置又发生了一点变化。

如果按照前面的逻辑，我们画出来的辅助线则是这样：

![https://jsd.cdn.zzko.cn/gh/caijinyc/images@main/picx/Untitled-6.2rqzyiy5eee0.webp](https://jsd.cdn.zzko.cn/gh/caijinyc/images@main/picx/Untitled-6.2rqzyiy5eee0.webp)

很显然，和 Figma 的表现不太一致，所以这时候我们就需要做一些特殊处理。

当对齐的锚点为中心点时，需要重新计算锚点的位置。就拿水平辅助线来说，y 轴的位置是不需要变化的，我们需要重新调整 x1, x2 的位置，让最终效果能达到下图：

![https://jsd.cdn.zzko.cn/gh/caijinyc/images@main/picx/Untitled-7.2k4oevmxa7g0.webp](https://jsd.cdn.zzko.cn/gh/caijinyc/images@main/picx/Untitled-7.2k4oevmxa7g0.webp)

通过下图图还可以发现，当被被拖拽元素（红色）的锚点在灰色元素内时，辅助线则会完全撑满对齐元素（灰色）：

![https://jsd.cdn.zzko.cn/gh/caijinyc/images@main/picx/Untitled-8.5rrfvcffctw0.webp](https://jsd.cdn.zzko.cn/gh/caijinyc/images@main/picx/Untitled-8.5rrfvcffctw0.webp)

那么我们就可以得出计算方案：

- 最左边的点为：`Math.min(对齐元素（灰色）的最左边、被拖拽元素（红色）的锚点)`
- 最右边的点为：`Math.max(对齐元素（灰色）的最右边、被拖拽元素（红色）的锚点)`

## 自动吸附

如果没有自动吸附，那么辅助线就缺少了灵魂。

自动吸附的原理就是判断两个元素的锚点在一定范围内就自动调整元素位置。但是和同样细节上的问题也很多。

### 基础实现

前面辅助线已经说了如何判断辅助线绘制，我们只需要在判断辅助线的时候加上一个范围判断，例如，当两个锚点的相对位置小于 n px 就对拖拽元素进行自动吸附。

我们先来看一下是怎么吸附到水平辅助线上的，吸附到水平辅助线就是垂直方向上的移动，我们需要将被拖动元素的进行 y 轴方向上的移动。如图：

![https://jsd.cdn.zzko.cn/gh/caijinyc/images@main/picx/Untitled-9.3kkt52i21lk0.webp](https://jsd.cdn.zzko.cn/gh/caijinyc/images@main/picx/Untitled-9.3kkt52i21lk0.webp)

知道原理之后我们就可以实现很基础的代码：

```jsx
for (let i = canvasObjects.length; i--; ) {
  // 遍历被拖拽对象的所有锚点

  Keys(draggingObjCoords).forEach((draggingObjPoint) => {

    const objCoords = getObjCoords(canvasObjects[i]);

    // 遍历对象的所有锚点
    Keys(objCoords).forEach((objPoint) => {

      // 判断两个锚点的水平坐标是否在一定范围内
      if (isInRange(draggingObjCoords[activeObjPoint].y, objCoords[objPoint].y)) {

        // 自动吸附到 obj 的 Y 轴上
        const y = objCoords[objPoint].y;
        moveToPoint(draggingObj, y);

      };

    });

  });

}

```

### 自动**吸附到下一个对象**

按照前面的方法，已经可以实现基础的自动吸附了，但是实际使用的时候，就会发现有点小问题：当鼠标移动时，没有办法吸附到下一个锚点上。

![https://jsd.cdn.zzko.cn/gh/caijinyc/images@main/picx/Untitled-10.6g3dk48s7zw0.webp](https://jsd.cdn.zzko.cn/gh/caijinyc/images@main/picx/Untitled-10.6g3dk48s7zw0.webp)

当我们的元素进行移动时，需要实时吸附下一个锚点。

这个时候就会出现两个问题：

1. 元素被吸附之后位置不再变化，锚点也不再变化，导致移动出现问题
2. 如果解决问题 1 后，又会发现：被拖拽元素一直处在被吸附的阈值中，被牢牢吸附在某个锚点上

这两点问题都会导致我们的元素移动出现问题，所以我们一个一个来解决

- *问题1：**元素被吸附之后位置不再变化，锚点也不再变化，导致移动出现问题

解决这个问题很简单，就是将被拖拽元素的锚点位置通过鼠标移动距离来进计算。

例如锚点原来的位置是：`{ x: 0, y: 0 }` 鼠标移动了 `{ x: 10, y: 10 }`，那么就可以得出锚点的位置为 `{ x: 10, y: 10 }` 。

然后再通过换算后的锚点位置来判断是否吸附到下一个锚点上。

- *问题2：**被拖拽元素一直处在被吸附的阈值中，被牢牢吸附在某个锚点上

当两个锚点位置靠的非常近时，两个锚点都在被拖拽元素锚点的阈值中，这时候如何判断应该吸附到下一个元素中呢？像这样：

![https://jsd.cdn.zzko.cn/gh/caijinyc/images@main/picx/Untitled-11.6by3scdztmc0.webp](https://jsd.cdn.zzko.cn/gh/caijinyc/images@main/picx/Untitled-11.6by3scdztmc0.webp)

这个时候可以通过判断，哪个锚点距离 **换算后的锚点位置** 更近，来确认该吸附到哪个锚点。

## 具体实现代码

具体实现可以参考我撸这个轮子 [fabric-guideline-plugin](https://github.com/caijinyc/fabric-guideline-plugin)，如果你也需要在 fabricjs 中添加辅助线，就可以直接使用这个包，文章里就不描述太多细节了，想体验效果可以直接访问 [CodeSandbox](https://codesandbox.io/s/frosty-clarke-w85qe7?file=/src/App.tsx)。

## 碎碎念

这种细节描述的文章真的难写，想写的通俗易懂真的太困难了。