import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Edit, Close } from '@mui/icons-material';
import './TeethChart.css';

// Teeth components based on odontogram structure
function Teeth({ start, end, x, y, handleChange, selectedTeeth, onToothClick }) {
    let tooths = getArray(start, end);

    return (
        <g id="gmain">
            {
                tooths.map((i) =>
                    <Tooth 
                        key={i}
                        number={i}
                        positionY={y}
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
    
    const handleClick = (e) => {
        onToothClick(number, e);
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

function TeethChart({ selectedTeeth: propSelectedTeeth, toothSummaries: propToothSummaries, onTeethChange, readOnly = false }) {
    const [selectedTeeth, setSelectedTeeth] = useState(propSelectedTeeth || []);
    const [toothSummaries, setToothSummaries] = useState(propToothSummaries || {});
    const [editingTooth, setEditingTooth] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [currentlySelectedTooth, setCurrentlySelectedTooth] = useState(null);
    const [lastSelectedTooth, setLastSelectedTooth] = useState(null);
    const [bulkEditDialogOpen, setBulkEditDialogOpen] = useState(false);
    const [bulkEditValue, setBulkEditValue] = useState('');
    const [addingTooth, setAddingTooth] = useState(false);
    const [newToothNumber, setNewToothNumber] = useState('');
    const [newToothSummary, setNewToothSummary] = useState('');
    const [multiSelectMode, setMultiSelectMode] = useState(false); // Track if Ctrl/Shift was used
    const [pendingMultiSelectTeeth, setPendingMultiSelectTeeth] = useState([]); // Store teeth selected during multi-select

    // Mock tooth history data
    const toothHistory = [
        { date: '08-12-2025', condition: 'Broken' },
        { date: '02-05-2025', condition: 'Malfunctioning tooth' }
    ];

    const handleToothClick = (toothNumber, event) => {
        // Prevent text selection during multi-select operations
        event.preventDefault();
        
        const isCtrlClick = event.ctrlKey || event.metaKey;
        const isShiftClick = event.shiftKey;

        if (isCtrlClick) {
            // Ctrl+Click: Add to selection for bulk editing
            if (!multiSelectMode) {
                // First Ctrl+click - start multi-select mode, clear previous pending teeth
                setMultiSelectMode(true);
                setPendingMultiSelectTeeth([]);
            }
            
            setSelectedTeeth(prev => {
                const isRemoving = prev.includes(toothNumber);
                const newSelected = isRemoving 
                    ? prev.filter(t => t !== toothNumber) 
                    : [...prev, toothNumber];
                
                if (onTeethChange) {
                    onTeethChange(newSelected);
                }
                
                // Update pending teeth - only track teeth added during this multi-select session
                setPendingMultiSelectTeeth(prevPending => {
                    if (isRemoving) {
                        // Remove from pending if it was there
                        return prevPending.filter(t => t !== toothNumber);
                    } else {
                        // Add to pending only if it doesn't have a summary
                        if (!toothSummaries[toothNumber]) {
                            return [...prevPending, toothNumber];
                        }
                        return prevPending;
                    }
                });
                
                return newSelected;
            });
            setLastSelectedTooth(toothNumber);
        } else if (isShiftClick && lastSelectedTooth !== null) {
            // Shift+Click: Select range
            if (!multiSelectMode) {
                // First Shift+click - start multi-select mode, clear previous pending teeth
                setMultiSelectMode(true);
                setPendingMultiSelectTeeth([]);
            }
            
            const allTeeth = [
                ...Array.from({length: 8}, (_, i) => 18 - i),  // 18-11
                ...Array.from({length: 8}, (_, i) => 21 + i),  // 21-28
                ...Array.from({length: 5}, (_, i) => 55 - i),  // 55-51
                ...Array.from({length: 5}, (_, i) => 61 + i),  // 61-65
                ...Array.from({length: 5}, (_, i) => 85 - i),  // 85-81
                ...Array.from({length: 5}, (_, i) => 71 + i),  // 71-75
                ...Array.from({length: 8}, (_, i) => 48 - i),  // 48-41
                ...Array.from({length: 8}, (_, i) => 31 + i),  // 31-38
            ];
            
            const startIndex = allTeeth.indexOf(lastSelectedTooth);
            const endIndex = allTeeth.indexOf(toothNumber);
            
            if (startIndex !== -1 && endIndex !== -1) {
                const [start, end] = startIndex < endIndex ? [startIndex, endIndex] : [endIndex, startIndex];
                const rangeTeeth = allTeeth.slice(start, end + 1);
                
                setSelectedTeeth(prev => {
                    const newSelected = [...new Set([...prev, ...rangeTeeth])];
                    if (onTeethChange) {
                        onTeethChange(newSelected);
                    }
                    
                    return newSelected;
                });
                
                // Update pending teeth - only add new teeth from range that don't have summaries
                setPendingMultiSelectTeeth(prevPending => {
                    const newTeethWithoutSummaries = rangeTeeth.filter(t => !toothSummaries[t]);
                    return [...new Set([...prevPending, ...newTeethWithoutSummaries])];
                });
            }
        } else {
            // Normal click: Toggle single tooth
            setMultiSelectMode(false); // Reset multi-select mode
            setPendingMultiSelectTeeth([]); // Clear pending teeth
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
                    // When removing a tooth, select the most recent one
                    const remaining = newSelected.filter(t => t !== toothNumber);
                    if (currentlySelectedTooth === toothNumber && remaining.length > 0) {
                        setCurrentlySelectedTooth(remaining[remaining.length - 1]);
                    } else if (remaining.length === 0) {
                        setCurrentlySelectedTooth(null);
                    }
                } else {
                    setCurrentlySelectedTooth(toothNumber);
                }
                
                if (onTeethChange) {
                    onTeethChange(newSelected);
                }
                
                return newSelected;
            });
            setLastSelectedTooth(toothNumber);
        }
    };

    // Detect when Ctrl/Shift keys are released to trigger bulk edit
    useEffect(() => {
        const handleKeyUp = (event) => {
            // Check if Ctrl or Shift was released
            if ((event.key === 'Control' || event.key === 'Meta' || event.key === 'Shift') && multiSelectMode) {
                // Only show dialog if there are pending teeth (teeth selected during THIS multi-select session)
                if (pendingMultiSelectTeeth.length > 1) {
                    setBulkEditDialogOpen(true);
                }
            }
        };

        const handleKeyDown = (event) => {
            // Handle ESC key to cancel bulk edit dialog
            if (event.key === 'Escape' && bulkEditDialogOpen) {
                event.preventDefault();
                handleBulkEditCancel();
            }
        };

        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [multiSelectMode, pendingMultiSelectTeeth, bulkEditDialogOpen]);

    const handleBulkEdit = () => {
        if (bulkEditValue.trim()) {
            const newSummaries = { ...toothSummaries };
            // Only apply to pending teeth (teeth selected during this multi-select session)
            pendingMultiSelectTeeth.forEach(tooth => {
                newSummaries[tooth] = bulkEditValue.trim();
            });
            setToothSummaries(newSummaries);
            setBulkEditValue('');
            setBulkEditDialogOpen(false);
            setMultiSelectMode(false); // Reset multi-select mode
            setPendingMultiSelectTeeth([]); // Clear pending teeth
        }
    };

    const handleBulkEditCancel = () => {
        // Remove teeth that were added during multi-select and have no summaries
        const teethToRemove = pendingMultiSelectTeeth;
        if (teethToRemove.length > 0) {
            setSelectedTeeth(prev => {
                const newSelected = prev.filter(t => !teethToRemove.includes(t));
                if (onTeethChange) {
                    onTeethChange(newSelected);
                }
                // Update currentlySelectedTooth if needed
                if (teethToRemove.includes(currentlySelectedTooth)) {
                    const remaining = newSelected.filter(t => !teethToRemove.includes(t));
                    setCurrentlySelectedTooth(remaining.length > 0 ? remaining[remaining.length - 1] : null);
                }
                return newSelected;
            });
        }
        setBulkEditValue('');
        setBulkEditDialogOpen(false);
        setMultiSelectMode(false);
        setPendingMultiSelectTeeth([]);
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
        // Don't trigger bulk edit when deleting individual teeth
        const wasMultiSelect = multiSelectMode;
        setMultiSelectMode(false);
        
        setSelectedTeeth(prev => {
            const newSelected = prev.filter(t => t !== num);
            
            if (onTeethChange) {
                onTeethChange(newSelected);
            }
            
            // Update currentlySelectedTooth - select the most recent tooth
            if (currentlySelectedTooth === num) {
                if (newSelected.length > 0) {
                    setCurrentlySelectedTooth(newSelected[newSelected.length - 1]);
                } else {
                    setCurrentlySelectedTooth(null);
                }
            }
            
            return newSelected;
        });
        
        setToothSummaries(prev => {
            const copy = { ...prev };
            delete copy[num];
            return copy;
        });
        
        if (editingTooth === num) {
            setEditingTooth(null);
            setEditValue('');
        }
        
        // Remove from pending multi-select teeth if present
        setPendingMultiSelectTeeth(prev => prev.filter(t => t !== num));
        
        // Restore multi-select mode if it was active (but don't trigger dialog)
        if (wasMultiSelect) {
            setTimeout(() => setMultiSelectMode(true), 0);
        }
    };

    const handleAddTooth = () => {
        const toothNum = parseInt(newToothNumber);
        if (toothNum && newToothSummary.trim()) {
            setSelectedTeeth(prev => {
                const newSelected = [...new Set([...prev, toothNum])];
                if (onTeethChange) {
                    onTeethChange(newSelected);
                }
                return newSelected;
            });
            setToothSummaries(prev => ({
                ...prev,
                [toothNum]: newToothSummary.trim()
            }));
            setNewToothNumber('');
            setNewToothSummary('');
            setAddingTooth(false);
        }
    };

    const getToothName = (number) => {
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

    return (
        <Box sx={{ width: '100%' }}>
            {/* 1. Teeth Chart with white background only around odontogram */}
            <Box
                sx={{
                    backgroundColor: 'white',
                    borderRadius: '18px',
                    p: 2,
                    mb: 3,
                    minHeight: '132px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <svg version="1.1" height="100%" width="100%" viewBox="0 0 760 320" preserveAspectRatio="xMidYMin meet">
                    <g transform="translate(6,8) scale(2.0)">
                        {/* Adult teeth */}
                        <Teeth start={18} end={11} x={0} y={0} selectedTeeth={selectedTeeth} onToothClick={handleToothClick} />
                        <Teeth start={21} end={28} x={200} y={0} selectedTeeth={selectedTeeth} onToothClick={handleToothClick} />

                        {/* Primary teeth */}
                        <Teeth start={55} end={51} x={66} y={40} selectedTeeth={selectedTeeth} onToothClick={handleToothClick} />
                        <Teeth start={61} end={65} x={200} y={40} selectedTeeth={selectedTeeth} onToothClick={handleToothClick} />

                        <Teeth start={85} end={81} x={66} y={80} selectedTeeth={selectedTeeth} onToothClick={handleToothClick} />
                        <Teeth start={71} end={75} x={200} y={80} selectedTeeth={selectedTeeth} onToothClick={handleToothClick} />

                        {/* Adult lower teeth */}
                        <Teeth start={48} end={41} x={0} y={120} selectedTeeth={selectedTeeth} onToothClick={handleToothClick} />
                        <Teeth start={31} end={38} x={200} y={120} selectedTeeth={selectedTeeth} onToothClick={handleToothClick} />
                    </g>
                </svg>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                {/* LEFT: Tooth History */}
                <Box sx={{ gridColumn: currentlySelectedTooth ? '1' : 'span 2' }}>
                    {currentlySelectedTooth && (
                        <Box
                            sx={{
                                backgroundColor: 'white',
                                borderRadius: '12px',
                                p: 2
                            }}
                        >
                            <Typography
                                sx={{
                                    fontFamily: 'Raleway, sans-serif',
                                    fontSize: '12px',
                                    mb: 1.5,
                                    textAlign: 'center',
                                    fontWeight: 500
                                }}
                            >
                                {currentlySelectedTooth} • Tooth History
                            </Typography>
                            {toothHistory.map((entry, index) => (
                                <Box
                                    key={index}
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        mb: 1
                                    }}
                                >
                                    <Typography sx={{ fontFamily: 'Raleway, sans-serif', fontSize: '10px', fontWeight: 500 }}>
                                        {entry.condition}
                                    </Typography>
                                    <Typography sx={{ fontFamily: 'Raleway, sans-serif', fontSize: '10px', fontWeight: 500 }}>
                                        {entry.date}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    )}
                </Box>

                {/* RIGHT: Selected Teeth List with Comments */}
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, px: 1 }}>
                        <Typography sx={{ fontFamily: 'Raleway, sans-serif', fontSize: '10px', fontWeight: 500 }}>
                            Tooth No.
                        </Typography>
                        <Typography sx={{ fontFamily: 'Raleway, sans-serif', fontSize: '10px', fontWeight: 500 }}>
                            Tooth Summary
                        </Typography>
                    </Box>
                    
                    {selectedTeeth.length === 0 ? (
                        <Box
                            sx={{
                                backgroundColor: 'white',
                                borderRadius: '8px',
                                p: 2,
                                textAlign: 'center'
                            }}
                        >
                            <Typography sx={{ fontFamily: 'Raleway, sans-serif', fontSize: '12px', color: '#999', fontStyle: 'italic' }}>
                                No teeth selected
                            </Typography>
                        </Box>
                    ) : (
                        selectedTeeth.map((toothNum) => (
                            <Box key={toothNum} sx={{ mb: 1 }}>
                                {editingTooth === toothNum ? (
                                    <Box
                                        sx={{
                                            backgroundColor: 'white',
                                            borderRadius: '8px',
                                            p: 1
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <Typography sx={{ fontFamily: 'Raleway, sans-serif', fontSize: '12px', fontWeight: 600, minWidth: '30px' }}>
                                                {toothNum}
                                            </Typography>
                                            <Typography sx={{ fontFamily: 'Raleway, sans-serif', fontSize: '10px', color: '#666' }}>
                                                {getToothName(toothNum)}
                                            </Typography>
                                        </Box>
                                        <TextField
                                            fullWidth
                                            multiline
                                            rows={2}
                                            size="small"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            placeholder="Add comments..."
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    fontFamily: 'Raleway, sans-serif',
                                                    fontSize: '12px'
                                                }
                                            }}
                                        />
                                        <Box sx={{ display: 'flex', gap: 1, mt: 1, justifyContent: 'flex-end' }}>
                                            <Button
                                                size="small"
                                                onClick={() => handleEditSave(toothNum)}
                                                sx={{
                                                    fontSize: '10px',
                                                    textTransform: 'none',
                                                    fontFamily: 'Raleway, sans-serif',
                                                    backgroundColor: '#2148c0',
                                                    color: 'white',
                                                    '&:hover': {
                                                        backgroundColor: '#1a3a9a'
                                                    }
                                                }}
                                            >
                                                Save
                                            </Button>
                                            <Button
                                                size="small"
                                                onClick={() => {
                                                    setEditingTooth(null);
                                                    setEditValue('');
                                                }}
                                                sx={{
                                                    fontSize: '10px',
                                                    textTransform: 'none',
                                                    fontFamily: 'Raleway, sans-serif'
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                        </Box>
                                    </Box>
                                ) : (
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'flex-start',
                                            backgroundColor: 'white',
                                            borderRadius: '8px',
                                            p: 1
                                        }}
                                    >
                                        <Box sx={{ flex: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                <Typography sx={{ fontFamily: 'Raleway, sans-serif', fontSize: '12px', fontWeight: 600 }}>
                                                    {toothNum}
                                                </Typography>
                                                <Typography sx={{ fontFamily: 'Raleway, sans-serif', fontSize: '10px', color: '#666' }}>
                                                    {getToothName(toothNum)}
                                                </Typography>
                                            </Box>
                                            {toothSummaries[toothNum] && (
                                                <Typography 
                                                    sx={{ 
                                                        fontFamily: 'Raleway, sans-serif', 
                                                        fontSize: '11px', 
                                                        color: '#333',
                                                        fontStyle: 'italic',
                                                        pl: 1,
                                                        borderLeft: '2px solid #2148c0'
                                                    }}
                                                >
                                                    "{toothSummaries[toothNum]}"
                                                </Typography>
                                            )}
                                        </Box>
                                        {!readOnly && (
                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                <IconButton 
                                                    size="small"
                                                    onClick={() => handleEdit(toothNum)}
                                                    sx={{ 
                                                        width: '18px', 
                                                        height: '18px',
                                                        p: 0
                                                    }}
                                                >
                                                    <Edit sx={{ fontSize: '12px', color: '#313144' }} />
                                                </IconButton>
                                                <IconButton 
                                                    size="small"
                                                    onClick={() => handleDelete(toothNum)}
                                                    sx={{ 
                                                        width: '18px', 
                                                        height: '18px',
                                                        p: 0
                                                    }}
                                                >
                                                    <Close sx={{ fontSize: '12px', color: '#313144' }} />
                                                </IconButton>
                                            </Box>
                                        )}
                                    </Box>
                                )}
                            </Box>
                        ))
                    )}
                    
                    {/* Add Tooth Section - Inline like Edit */}
                    {!readOnly && (
                        addingTooth ? (
                            <Box
                                sx={{
                                    backgroundColor: 'white',
                                    borderRadius: '8px',
                                    p: 1,
                                    mt: 1
                                }}
                            >
                                <TextField
                                    fullWidth
                                    size="small"
                                    type="number"
                                    value={newToothNumber}
                                    onChange={(e) => setNewToothNumber(e.target.value)}
                                    placeholder="Tooth Number (e.g., 85)"
                                    sx={{
                                        mb: 1,
                                        '& .MuiOutlinedInput-root': {
                                            fontFamily: 'Raleway, sans-serif',
                                            fontSize: '12px'
                                        }
                                    }}
                                />
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={2}
                                    size="small"
                                    value={newToothSummary}
                                    onChange={(e) => setNewToothSummary(e.target.value)}
                                    placeholder="Tooth summary/comments..."
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            fontFamily: 'Raleway, sans-serif',
                                            fontSize: '12px'
                                        }
                                    }}
                                />
                                <Box sx={{ display: 'flex', gap: 1, mt: 1, justifyContent: 'flex-end' }}>
                                    <Button
                                        size="small"
                                        onClick={handleAddTooth}
                                        disabled={!newToothNumber || !newToothSummary.trim()}
                                        sx={{
                                            fontSize: '10px',
                                            textTransform: 'none',
                                            fontFamily: 'Raleway, sans-serif',
                                            backgroundColor: '#2148c0',
                                            color: 'white',
                                            '&:hover': {
                                                backgroundColor: '#1a3a9a'
                                            },
                                            '&:disabled': {
                                                backgroundColor: '#ccc'
                                            }
                                        }}
                                    >
                                        Add
                                    </Button>
                                    <Button
                                        size="small"
                                        onClick={() => {
                                            setAddingTooth(false);
                                            setNewToothNumber('');
                                            setNewToothSummary('');
                                        }}
                                        sx={{
                                            fontSize: '10px',
                                            textTransform: 'none',
                                            fontFamily: 'Raleway, sans-serif'
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </Box>
                            </Box>
                        ) : (
                            <Typography
                                sx={{
                                    fontFamily: 'Raleway, sans-serif',
                                    fontWeight: 800,
                                    fontSize: '14px',
                                    color: '#2148c0',
                                    cursor: 'pointer',
                                    mt: 1,
                                    '&:hover': { textDecoration: 'underline' }
                                }}
                                onClick={() => setAddingTooth(true)}
                            >
                                Add Tooth
                            </Typography>
                        )
                    )}
                </Box>
            </Box>

            {/* Bulk Edit Dialog for Multiple Teeth */}
            <Dialog open={bulkEditDialogOpen && pendingMultiSelectTeeth.length > 1} onClose={handleBulkEditCancel}>
                <DialogTitle sx={{ fontFamily: 'Raleway, sans-serif' }}>
                    Edit {pendingMultiSelectTeeth.length} Selected Teeth
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ fontFamily: 'Raleway, sans-serif', fontSize: '14px', mb: 2, color: '#666' }}>
                        Selected teeth: {pendingMultiSelectTeeth.sort((a, b) => a - b).join(', ')}
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        value={bulkEditValue}
                        onChange={(e) => setBulkEditValue(e.target.value)}
                        placeholder="Enter summary for all selected teeth..."
                        autoFocus
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                fontFamily: 'Raleway, sans-serif'
                            }
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleBulkEditCancel} sx={{ fontFamily: 'Raleway, sans-serif', textTransform: 'none' }}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleBulkEdit} 
                        variant="contained"
                        sx={{ 
                            fontFamily: 'Raleway, sans-serif', 
                            textTransform: 'none',
                            backgroundColor: '#2148c0',
                            '&:hover': {
                                backgroundColor: '#1a3a9a'
                            }
                        }}
                    >
                        Apply to All
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default TeethChart;
