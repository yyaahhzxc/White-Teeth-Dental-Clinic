import React, { useState } from 'react';
import './TeethChart.css';
import ToothSummary from './ToothSummary';

// Teeth components based on odontogram structure
function Teeth({ start, end, x, y, handleChange, selectedTeeth, onToothClick }) {
    let tooths = getArray(start, end);

    // Use a tighter horizontal spacing (20) and no internal scale so the svg can be left-aligned
    return (
        <g id="gmain">
            {
                tooths.map((i) =>
                    <Tooth 
                        key={i}
                        number={i}
                        positionY={y}
                        // slightly increased spacing multiplier to 22 for a larger chart
                        positionX={Math.abs((i - start) * 22) + x}
                        isSelected={selectedTeeth.includes(i)}
                        onToothClick={onToothClick}
                    />
                )
            }
        </g>
    )
}

function Tooth({ number, positionX, positionY, isSelected, onToothClick }) {
    const translate = `translate(${positionX},${positionY})`;
    
    const handleClick = () => {
        onToothClick(number);
    };

    return (
        <svg className="tooth">
            <g transform={translate} onClick={handleClick} style={{ cursor: 'pointer' }}>
                {/* Top section */}
                <polygon
                    points="0,0 20,0 15,5 5,5"
                    className={isSelected ? 'selected' : ''}
                    stroke="black"
                    strokeWidth="0.5"
                    fill={isSelected ? '#f45252d4' : 'white'}
                />
                {/* Bottom section */}
                <polygon
                    points="5,15 15,15 20,20 0,20"
                    className={isSelected ? 'selected' : ''}
                    stroke="black"
                    strokeWidth="0.5"
                    fill={isSelected ? '#f45252d4' : 'white'}
                />
                {/* Left section */}
                <polygon
                    points="15,5 20,0 20,20 15,15"
                    className={isSelected ? 'selected' : ''}
                    stroke="black"
                    strokeWidth="0.5"
                    fill={isSelected ? '#f45252d4' : 'white'}
                />
                {/* Right section */}
                <polygon
                    points="0,0 5,5 5,15 0,20"
                    className={isSelected ? 'selected' : ''}
                    stroke="black"
                    strokeWidth="0.5"
                    fill={isSelected ? '#f45252d4' : 'white'}
                />
                {/* Center section */}
                <polygon
                    points="5,5 15,5 15,15 5,15"
                    className={isSelected ? 'selected' : ''}
                    stroke="black"
                    strokeWidth="0.5"
                    fill={isSelected ? '#f45252d4' : 'white'}
                />
                {/* Tooth number */}
                <text
                    x="6"
                    y="30"
                    stroke="navy"
                    fill="navy"
                    strokeWidth="0.1"
                    className="tooth-number">
                    {number}
                </text>
            </g>
        </svg>
    )
}

function getArray(start, end) {
    if (start > end) return getInverseArray(start, end);

    let list = [];
    for (var i = start; i <= end; i++) {
        list.push(i);
    }

    return list;
}

function getInverseArray(start, end) {
    let list = [];

    for (var i = start; i >= end; i--) {
        list.push(i);
    }

    return list;
}

function TeethChart() {
    const [selectedTeeth, setSelectedTeeth] = useState([]);
    const [toothSummaries, setToothSummaries] = useState({});
    const [editingTooth, setEditingTooth] = useState(null);
    const [editValue, setEditValue] = useState('');

    const handleToothClick = (toothNumber) => {
        setSelectedTeeth(prev => {
            const newSelected = prev.includes(toothNumber) 
                ? prev.filter(t => t !== toothNumber) 
                : [...prev, toothNumber];
            
            if (prev.includes(toothNumber)) {
                setToothSummaries(prevSummaries => {
                    const copy = { ...prevSummaries };
                    delete copy[toothNumber];
                    return copy;
                });
            }
            
            return newSelected;
        });
    };

    const handleEdit = (num) => {
        setEditingTooth(num);
        setEditValue(toothSummaries[num] || '');
    };

    const handleEditSave = (num) => {
        setToothSummaries(prev => ({ ...prev, [num]: editValue }));
        setEditingTooth(null);
        setEditValue('');
    };

    const handleDelete = (num) => {
        setSelectedTeeth(prev => prev.filter(t => t !== num));
        setToothSummaries(prev => {
            const copy = { ...prev };
            delete copy[num];
            return copy;
        });
        if (editingTooth === num) {
            setEditingTooth(null);
            setEditValue('');
        }
    };

    const getToothSummary = (number) => {
        const toothTypes = {
            // Upper teeth
            18: 'Third Molar (Wisdom Tooth)', 17: 'Second Molar', 16: 'First Molar',
            15: 'Second Premolar', 14: 'First Premolar', 13: 'Canine',
            12: 'Lateral Incisor', 11: 'Central Incisor',
            21: 'Central Incisor', 22: 'Lateral Incisor', 23: 'Canine',
            24: 'First Premolar', 25: 'Second Premolar', 26: 'First Molar',
            27: 'Second Molar', 28: 'Third Molar (Wisdom Tooth)',
            
            // Primary upper teeth
            55: 'Upper Second Primary Molar', 54: 'Upper First Primary Molar',
            53: 'Upper Primary Canine', 52: 'Upper Primary Lateral Incisor',
            51: 'Upper Primary Central Incisor',
            61: 'Upper Primary Central Incisor', 62: 'Upper Primary Lateral Incisor',
            63: 'Upper Primary Canine', 64: 'Upper First Primary Molar',
            65: 'Upper Second Primary Molar',
            
            // Primary lower teeth  
            85: 'Lower Second Primary Molar', 84: 'Lower First Primary Molar',
            83: 'Lower Primary Canine', 82: 'Lower Primary Lateral Incisor',
            81: 'Lower Primary Central Incisor',
            71: 'Lower Primary Central Incisor', 72: 'Lower Primary Lateral Incisor',
            73: 'Lower Primary Canine', 74: 'Lower First Primary Molar',
            75: 'Lower Second Primary Molar',
            
            // Lower teeth
            48: 'Third Molar (Wisdom Tooth)', 47: 'Second Molar', 46: 'First Molar',
            45: 'Second Premolar', 44: 'First Premolar', 43: 'Canine',
            42: 'Lateral Incisor', 41: 'Central Incisor',
            31: 'Central Incisor', 32: 'Lateral Incisor', 33: 'Canine',
            34: 'First Premolar', 35: 'Second Premolar', 36: 'First Molar',
            37: 'Second Molar', 38: 'Third Molar (Wisdom Tooth)'
        };
        return toothTypes[number] || 'Unknown Tooth';
    };

    const getToothType = (number) => {
        if ([18, 17, 16, 26, 27, 28, 48, 47, 46, 36, 37, 38].includes(number)) return 'molar';
        if ([15, 14, 24, 25, 45, 44, 34, 35].includes(number)) return 'premolar';
        if ([13, 23, 43, 33].includes(number)) return 'canine';
        if ([12, 11, 21, 22, 42, 41, 31, 32].includes(number)) return 'incisor';
        return 'primary';
    };

    return (
        <div className="teeth-chart-container">
            <div className="teeth-chart-bg">
                {/* enlarge viewbox horizontally and vertically to give more room */}
                <svg version="1.1" height="100%" width="100%" viewBox="0 0 760 320" preserveAspectRatio="xMidYMin meet">
                    {/* Outer translate to nudge the entire chart left and slightly down; scale up to fill more width */}
                    <g transform="translate(6,8) scale(2.0)">
                        {/* Adult teeth */}
                        <Teeth start={18} end={11} x={0} y={0} selectedTeeth={selectedTeeth} onToothClick={handleToothClick} />
                        <Teeth start={21} end={28} x={200} y={0} selectedTeeth={selectedTeeth} onToothClick={handleToothClick} />

                        {/* Primary teeth (left: centered, right: match-right) */}
                        <Teeth start={55} end={51} x={66} y={40} selectedTeeth={selectedTeeth} onToothClick={handleToothClick} />
                        <Teeth start={61} end={65} x={200} y={40} selectedTeeth={selectedTeeth} onToothClick={handleToothClick} />

                        <Teeth start={85} end={81} x={66} y={80} selectedTeeth={selectedTeeth} onToothClick={handleToothClick} />
                        <Teeth start={71} end={75} x={200} y={80} selectedTeeth={selectedTeeth} onToothClick={handleToothClick} />

                        {/* Adult lower teeth */}
                        <Teeth start={48} end={41} x={0} y={120} selectedTeeth={selectedTeeth} onToothClick={handleToothClick} />
                        <Teeth start={31} end={38} x={200} y={120} selectedTeeth={selectedTeeth} onToothClick={handleToothClick} />
                    </g>
                </svg>
                
                <ToothSummary 
                    selectedTeeth={selectedTeeth}
                    toothSummaries={toothSummaries}
                    editingTooth={editingTooth}
                    editValue={editValue}
                    onEdit={handleEdit}
                    onEditSave={handleEditSave}
                    onDelete={handleDelete}
                    setEditValue={setEditValue}
                />
            </div>
        </div>
    );
}

export default TeethChart;
