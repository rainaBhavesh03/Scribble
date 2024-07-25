
import { useEffect, useRef, useState, MouseEvent } from 'react';
import { Socket } from 'socket.io-client';

interface DrawingAction {
  path: { x: number; y: number }[];
  style: {
    color: string;
    lineWidth: number;
  };
}


export default function Canvas({ isSubject, socket } : {isSubject: boolean,socket: Socket}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const divRef = useRef<HTMLDivElement | null>(null);
  const [divSize, setDivSize] = useState({ width: 0, height: 0 });
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('black');
  const [lineWidth, setLineWidth] = useState(3);
  const [drawingActions, setDrawingActions] = useState<DrawingAction[]>([]);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  const [currentStyle, setCurrentStyle] = useState({ color: 'black', lineWidth: 3 });

  useEffect(() => {
    if (divRef.current) {
      setDivSize({ width: divRef.current.clientWidth, height: divRef.current.clientHeight });
    }
  }, []);

  useEffect(() => {
    if (canvasRef.current && divSize) {
      const canvas = canvasRef.current;
      canvas.width = divRef.current?.clientWidth || 100;
      canvas.height = divRef.current?.clientHeight || 400;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        setContext(ctx);
        reDrawPreviousData(ctx);
      }
    }
  }, [divSize]);

  useEffect(() => {
    const handleDrawingGet = (data: DrawingAction) => {
      console.log('drawingGet', data);
      if (context) {
        drawReceivedData({ ctx: context, data });
      }
    };

    if (socket) {
      console.log('Setting up socket listener');
      socket.on('drawingGet', handleDrawingGet);
    }

    return () => {
      if (socket) {
        console.log('Cleaning up socket listener');
        socket.off('drawingGet', handleDrawingGet);
      }
    };
  }, [socket, context]);

  const startDrawing = (e: MouseEvent<HTMLCanvasElement>) => {
    if (context) {
      context.beginPath();
      context.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      setDrawing(true);
    }
  };

  const draw = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!drawing || !context) return;
    context.strokeStyle = currentStyle.color;
    context.lineWidth = currentStyle.lineWidth;
    context.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    context.stroke();
    const newPoint = { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
    setCurrentPath(prevPath => [...prevPath, newPoint]);
  };

  const endDrawing = () => {
    setDrawing(false);
    if (context) context.closePath();
    if (currentPath.length > 0) {
      const newAction = { path: currentPath, style: currentStyle };
      setDrawingActions(prevActions => [...prevActions, newAction]);
      setCurrentPath([]);
      
      // Emit final drawing action
        console.log('sending draw action');
      socket.emit('drawingSend', newAction);
    }
  };

  const changeColor = (color: string) => {
    setCurrentColor(color);
    setCurrentStyle(prevStyle => ({ ...prevStyle, color }));
  };

  const changeWidth = (width: string) => {
    const parsedWidth = parseInt(width, 10);
    setLineWidth(parsedWidth);
    setCurrentStyle(prevStyle => ({ ...prevStyle, lineWidth: parsedWidth }));
  };

  const undoDrawing = () => {
    if (drawingActions.length > 0) {
      const updatedActions = [...drawingActions];
      updatedActions.pop();
      setDrawingActions(updatedActions);
      if (canvasRef.current) {
        const newContext = canvasRef.current.getContext('2d');
        if (newContext) {
          newContext.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          reDrawPreviousData(newContext);
        }
      }
    }
  };

  const clearDrawing = () => {
    setDrawingActions([]);
    setCurrentPath([]);
    if (canvasRef.current) {
      const newContext = canvasRef.current.getContext('2d');
      if (newContext) {
        newContext.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  };

  const reDrawPreviousData = (ctx: CanvasRenderingContext2D) => {
    drawingActions.forEach(({ path, style }) => {
      ctx.beginPath();
      ctx.strokeStyle = style.color;
      ctx.lineWidth = style.lineWidth;
      ctx.moveTo(path[0].x, path[0].y);
      path.forEach((point) => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    });
  };

  const drawReceivedData = ({ctx, data}: {ctx: CanvasRenderingContext2D, data: DrawingAction}) => {
      ctx.beginPath();
      ctx.strokeStyle = data.style.color;
      ctx.lineWidth = data.style.lineWidth;
      ctx.moveTo(data.path[0].x, data.path[0].y);
      data.path.forEach((point) => {
          ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
  };


  return (
    <div className={'canvas_wrapper'} ref={divRef}>
        {isSubject ? (
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={endDrawing}
            onMouseOut={endDrawing}
            className='canvas'
          /> ) : (
          <canvas
            ref={canvasRef}
            className='canvas'
          />
          )
        }
      {isSubject ? (
      <div>
        <div className={"canvas_options"}>
          {['red', 'blue', 'yellow', 'green', 'orange', 'black', 'white'].map((color) => (
            <div
              key={color}
              className={`color-swatch ${currentColor === color ? "canvas_color_selected" : ""}`}
              onClick={() => changeColor(color)}
              style={{ backgroundColor: color, width: '20px', height: '20px', display: 'inline-block', cursor: 'pointer', margin: '5px' }}
            />
          ))}
        </div>
        <label className="canvas_label" htmlFor='canvas_linewidth'>Line Width:</label>
        <input
          id="canvas_linewidth"
          type='range'
          min='1'
          max='10'
          value={lineWidth}
          onChange={(e) => changeWidth(e.target.value)}
        />
        <br/>
        <button className={'canvas_options_btn'} onClick={clearDrawing}>Clear</button>
        <br/>
        <button className={'canvas_options_btn'} onClick={undoDrawing}>Undo</button>
        <span>Undo works except for the first line !!</span>
      </div> ) : (<></>)
      }
    </div>
  );
}

