import React, { useRef, useEffect, useState } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, RemoveFormatting } from 'lucide-react';

const SimpleEditor = ({ value, onChange, placeholder }) => {
    const editorRef = useRef(null);
    const isUpdating = useRef(false);
    const [activeFormats, setActiveFormats] = useState(new Set());

    useEffect(() => {
        if (editorRef.current && !isUpdating.current) {
            const editor = editorRef.current;
            if (editor.innerHTML !== value) {
                editor.innerHTML = value || '';
            }
        }
    }, [value]);

    const updateActiveFormats = () => {
        const active = new Set();
        if (document.queryCommandState('bold')) active.add('bold');
        if (document.queryCommandState('italic')) active.add('italic');
        if (document.queryCommandState('underline')) active.add('underline');
        if (document.queryCommandState('insertUnorderedList')) active.add('insertUnorderedList');
        if (document.queryCommandState('insertOrderedList')) active.add('insertOrderedList');
        if (document.queryCommandState('justifyLeft')) active.add('justifyLeft');
        if (document.queryCommandState('justifyCenter')) active.add('justifyCenter');
        if (document.queryCommandState('justifyRight')) active.add('justifyRight');
        setActiveFormats(active);
    };

    const handleInput = () => {
        if (editorRef.current) {
            isUpdating.current = true;
            const htmlContent = editorRef.current.innerHTML;
            const textContent = editorRef.current.innerText;
            onChange({ html: htmlContent, text: textContent });
            updateActiveFormats();
            setTimeout(() => {
                isUpdating.current = false;
            }, 0);
        }
    };

    const handleSelectionChange = () => {
        updateActiveFormats();
    };

    useEffect(() => {
        document.addEventListener('selectionchange', handleSelectionChange);
        return () => document.removeEventListener('selectionchange', handleSelectionChange);
    }, []);

    const execCommand = (command, value = null) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
        handleInput();
    };

    const buttonGroups = [
        [
            { command: 'bold', icon: Bold, label: 'Bold (Ctrl+B)' },
            { command: 'italic', icon: Italic, label: 'Italic (Ctrl+I)' },
            { command: 'underline', icon: Underline, label: 'Underline (Ctrl+U)' }
        ],
        [
            { command: 'insertUnorderedList', icon: List, label: 'Bullet List' },
            { command: 'insertOrderedList', icon: ListOrdered, label: 'Numbered List' }
        ],
        [
            { command: 'justifyLeft', icon: AlignLeft, label: 'Align Left' },
            { command: 'justifyCenter', icon: AlignCenter, label: 'Align Center' },
            { command: 'justifyRight', icon: AlignRight, label: 'Align Right' }
        ],
        [
            { command: 'removeFormat', icon: RemoveFormatting, label: 'Clear Formatting' }
        ]
    ];

    return (
        <div className="simple-editor">
            <div className="editor-toolbar">
                {buttonGroups.map((group, groupIndex) => (
                    <React.Fragment key={groupIndex}>
                        {groupIndex > 0 && <div className="toolbar-separator" />}
                        <div className="toolbar-group">
                            {group.map(({ command, icon: Icon, label }) => (
                                <button
                                    key={command}
                                    type="button"
                                    className={`editor-btn ${activeFormats.has(command) ? 'active' : ''}`}
                                    onClick={() => execCommand(command)}
                                    title={label}
                                    aria-label={label}
                                >
                                    <Icon size={16} />
                                </button>
                            ))}
                        </div>
                    </React.Fragment>
                ))}
            </div>
            <div
                ref={editorRef}
                className="editor-content"
                contentEditable
                onInput={handleInput}
                onMouseUp={updateActiveFormats}
                onKeyUp={updateActiveFormats}
                data-placeholder={placeholder}
                suppressContentEditableWarning
            />
        </div>
    );
};

export default SimpleEditor;
