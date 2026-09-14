import React from 'react';

const TrafficLight = ({ stockPiso, stockMinimo, showText = false }) => {
  let colorClass = 'bg-green-500';
  let text = 'Suficiente';

  if (stockPiso === 0) {
    colorClass = 'bg-red-500';
    text = 'Agotado';
  } else if (stockPiso <= stockMinimo) {
    colorClass = 'bg-yellow-400';
    text = 'Alerta';
  }

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-4 h-4 rounded-full shadow-sm border border-black/10 ${colorClass}`}></div>
      {showText && <span className="text-sm font-medium text-gray-700">{text}</span>}
    </div>
  );
};

export default TrafficLight;
