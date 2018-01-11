import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';

declare const SVG;

@Component({
  selector: 'svg-js',
  templateUrl: './svg-js.component.html',
  styleUrls: ['./svg-js.component.scss']
})
export class SvgJsComponent implements OnInit {

  @Input() path: string;
  @Input() type: string;
  @ViewChild('draw') draw: ElementRef;

  constructor() { }

  ngOnInit() {
    this.init();
  }

  private init() {
    const draw = SVG(this.draw.nativeElement);
    const center: Point = this.getCenter(draw);

    const path_bg = draw.path(this.path);

    path_bg
      .fill('none')
      .stroke({ width: 2, color: '#ccc' })
      .center(center.x, center.y);

    const point = this.getPoint(path_bg, center);

    const circle = draw.circle(10).fill('#ff0066');

    circle.center(point.x, point.y);

    circle.draggable().on('dragmove', (e) => {
      e.preventDefault();
      const cursor_point = [e.detail.p.x, e.detail.p.y];
      const closest_point = this.getClosestPoint(path_bg, cursor_point);
      circle.center(closest_point[0] || point.x, closest_point[1] || point.y);
    });
  }

  private getCenter(draw): Point {
    const viewbox = draw.viewbox();
    const width = viewbox.width / 2;
    const height = viewbox.height / 2;

    return({
      x: width,
      y: height
    });
  }

  private getPoint(draw, center): Point {
    const rbox = draw.rbox();

    const width = center.x - rbox.width / 2;
    let height: number;
    switch (this.type) {
      case 'square':
        height = center.y - rbox.height / 2;
        break;
      case 'circle':
        height = center.y;
        break;
    }

    return({
      x: width,
      y: height
    });
  }

  private getClosestPoint(path_node, point) {

    function distance2(p) {
      const dx = p.x - point[0],
        dy = p.y - point[1];
      return dx * dx + dy * dy;
    }

    const pathLength = path_node.length();
    let precision = 4,
      best,
      bestLength,
      bestDistance = Infinity;

    // linear scan for coarse approximation
    for (let scan, scanLength = 0, scanDistance; scanLength <= pathLength; scanLength += precision) {
      if ((scanDistance = distance2(scan = path_node.pointAt(scanLength))) < bestDistance) {
        best = scan, bestLength = scanLength, bestDistance = scanDistance;
      }
    }

    // binary search for precise estimate
    precision /= 2;
    while (precision > 0.5) {
      let before,
        after,
        beforeLength,
        afterLength,
        beforeDistance,
        afterDistance;

      if ((beforeLength = bestLength - precision) >= 0 &&
        (beforeDistance = distance2(before = path_node.pointAt(beforeLength))) < bestDistance) {
        best = before, bestLength = beforeLength, bestDistance = beforeDistance;
      } else if ((afterLength = bestLength + precision) <= pathLength &&
        (afterDistance = distance2(after = path_node.pointAt(afterLength))) < bestDistance) {
        best = after, bestLength = afterLength, bestDistance = afterDistance;
      } else {
        precision /= 2;
      }
    }

    best = [best.x, best.y];

    best.distance = Math.sqrt(bestDistance);
    best.length = bestLength;
    return best;
  }

}

class Point {
  x: number;
  y: number;
}
