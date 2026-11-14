import React, { useState, useEffect } from 'react';
import {
  AlignLeft,
  ArrowDown,
  ArrowUp,
  Check,
  CheckSquare,
  CircleDot,
  Eye,
  EyeOff,
  Layers,
  List,
  Pencil,
  Plus,
  Save,
  Sliders,
  Sparkles,
  Trash2,
  Type,
  Undo2,
  X,
} from 'lucide-react';
import { DEFAULT_INQUIRY_FORM_SETTINGS } from '../utils/dental.js';
import { api } from '../services/api.js';

export default function InquiryFormSettings({
  settings: initialSettings,
  onSaveSuccess,
  notify,
}) {
  const [activeTab, setActiveTab] = useState('instructions');
  const [formSettings, setFormSettings] = useState(() => ({
    ...DEFAULT_INQUIRY_FORM_SETTINGS,
    ...(initialSettings || {}),
  }));

  // Track original for cancel / dirty check
  const [originalSettings, setOriginalSettings] = useState(() => ({
    ...DEFAULT_INQUIRY_FORM_SETTINGS,
    ...(initialSettings || {}),
  }));

  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Input states for adding new options
  const [newInstruction, setNewInstruction] = useState('');
  const [newStage, setNewStage] = useState('');
  const [newShade, setNewShade] = useState('');

  // Editing state for inline renames
  const [editingItem, setEditingItem] = useState(null); // { category, id, name }

  // Custom Field Form State
  const [isAddingField, setIsAddingField] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState(null);
  const [fieldForm, setFieldForm] = useState({
    name: '',
    type: 'text', // 'text' | 'textarea' | 'select' | 'multiselect' | 'radio'
    options: [],
    required: false,
    enabled: true,
  });
  const [newOptionInput, setNewOptionInput] = useState('');

  useEffect(() => {
    if (initialSettings) {
      setFormSettings({
        ...DEFAULT_INQUIRY_FORM_SETTINGS,
        ...initialSettings,
      });
      setOriginalSettings({
        ...DEFAULT_INQUIRY_FORM_SETTINGS,
        ...initialSettings,
      });
      setIsDirty(false);
    }
  }, [initialSettings]);

  const updateSettingState = (updater) => {
    setFormSettings((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      setIsDirty(true);
      return next;
    });
  };

  // Reorder helper
  const moveItem = (category, index, direction) => {
    updateSettingState((prev) => {
      const list = [...(prev[category] || [])];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= list.length) return prev;
      const [moved] = list.splice(index, 1);
      list.splice(targetIndex, 0, moved);
      return { ...prev, [category]: list };
    });
  };

  // Toggle enabled
  const toggleEnabled = (category, id) => {
    updateSettingState((prev) => {
      const list = (prev[category] || []).map((item) =>
        item.id === id ? { ...item, enabled: !item.enabled } : item
      );
      return { ...prev, [category]: list };
    });
  };

  // Delete option
  const deleteItem = (category, id) => {
    updateSettingState((prev) => {
      const list = (prev[category] || []).filter((item) => item.id !== id);
      return { ...prev, [category]: list };
    });
  };

  // Add simple option
  const addOption = (category, name, setNameFn, prefix) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const exists = (formSettings[category] || []).some(
      (x) => x.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      notify(`"${trimmed}" is already in this list.`);
      return;
    }

    const newItem = {
      id: `${prefix}-${Date.now()}`,
      name: trimmed,
      enabled: true,
    };

    updateSettingState((prev) => ({
      ...prev,
      [category]: [...(prev[category] || []), newItem],
    }));
    setNameFn('');
  };

  // Save rename
  const handleSaveRename = () => {
    if (!editingItem || !editingItem.name.trim()) {
      setEditingItem(null);
      return;
    }
    const { category, id, name } = editingItem;
    updateSettingState((prev) => {
      const list = (prev[category] || []).map((x) =>
        x.id === id ? { ...x, name: name.trim() } : x
      );
      return { ...prev, [category]: list };
    });
    setEditingItem(null);
  };

  // --- Custom Field Handlers ---
  const handleOpenAddField = () => {
    setFieldForm({
      name: '',
      type: 'text',
      options: [],
      required: false,
      enabled: true,
    });
    setNewOptionInput('');
    setEditingFieldId(null);
    setIsAddingField(true);
  };

  const handleOpenEditField = (field) => {
    setFieldForm({
      name: field.name,
      type: field.type,
      options: [...(field.options || [])],
      required: Boolean(field.required),
      enabled: field.enabled !== false,
    });
    setNewOptionInput('');
    setEditingFieldId(field.id);
    setIsAddingField(true);
  };

  const handleAddOptionToField = () => {
    const trimmed = newOptionInput.trim();
    if (!trimmed) return;
    if (fieldForm.options.includes(trimmed)) {
      notify(`Option "${trimmed}" is already added.`);
      return;
    }
    setFieldForm((prev) => ({
      ...prev,
      options: [...prev.options, trimmed],
    }));
    setNewOptionInput('');
  };

  const handleRemoveOptionFromField = (opt) => {
    setFieldForm((prev) => ({
      ...prev,
      options: prev.options.filter((o) => o !== opt),
    }));
  };

  const handleSaveCustomField = (e) => {
    e.preventDefault();
    const name = fieldForm.name.trim();
    if (!name) {
      notify('Please enter a field name.');
      return;
    }

    if (['select', 'multiselect', 'radio'].includes(fieldForm.type) && fieldForm.options.length === 0) {
      notify('Please add at least one option for this selection field.');
      return;
    }

    updateSettingState((prev) => {
      const list = [...(prev.customFields || [])];
      if (editingFieldId) {
        const index = list.findIndex((f) => f.id === editingFieldId);
        if (index >= 0) {
          list[index] = { ...list[index], ...fieldForm, name };
        }
      } else {
        list.push({
          id: `cf-${Date.now()}`,
          name,
          type: fieldForm.type,
          options: fieldForm.options,
          required: fieldForm.required,
          enabled: fieldForm.enabled,
        });
      }
      return { ...prev, customFields: list };
    });

    setIsAddingField(false);
    setEditingFieldId(null);
  };

  const handleDeleteCustomField = (id) => {
    if (confirm('Are you sure you want to remove this custom field? Existing inquiries will preserve their original data.')) {
      deleteItem('customFields', id);
    }
  };

  // --- Save / Cancel Settings to Backend ---
  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const res = await api.updateInquiryFormSettings(formSettings);
      setOriginalSettings(res || formSettings);
      setIsDirty(false);
      if (onSaveSuccess) onSaveSuccess(res || formSettings);
      notify('Inquiry Form Settings saved to database successfully!');
    } catch (err) {
      notify(err.message || 'Failed to save settings. Saved locally.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormSettings({ ...originalSettings });
    setIsDirty(false);
    setEditingItem(null);
    setIsAddingField(false);
    notify('Form settings changes reverted.');
  };

  return (
    <div className="inquiry-form-settings-wrapper">
      {/* Top Header & Navigation Tabs */}
      <div className="ifs-header">
        <div className="ifs-title-group">
          <div className="ifs-badge">
            <Sliders size={16} /> FORM BUILDER
          </div>
          <h3>Inquiry Form Settings</h3>
          <p>
            Add, rename, reorder, or disable options displayed on the customer inquiry form.
            All historical inquiry records remain completely protected.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="ifs-actions">
          {isDirty && (
            <button
              type="button"
              className="outline-btn"
              onClick={handleCancel}
              disabled={saving}
            >
              <Undo2 size={15} /> Cancel
            </button>
          )}
          <button
            type="button"
            className="primary-btn"
            onClick={handleSaveSettings}
            disabled={saving || !isDirty}
          >
            <Save size={15} /> {saving ? 'Saving…' : 'Save Form Settings'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="ifs-tabs">
        <button
          type="button"
          className={`ifs-tab ${activeTab === 'instructions' ? 'active' : ''}`}
          onClick={() => setActiveTab('instructions')}
        >
          <Layers size={15} />
          <span>Lab Instructions</span>
          <span className="count-pill">
            {(formSettings.labInstructions || []).filter((x) => x.enabled).length}
          </span>
        </button>

        <button
          type="button"
          className={`ifs-tab ${activeTab === 'trials' ? 'active' : ''}`}
          onClick={() => setActiveTab('trials')}
        >
          <CheckSquare size={15} />
          <span>Trial Options</span>
          <span className="count-pill">
            {(formSettings.trialOptions || []).filter((x) => x.enabled).length}
          </span>
        </button>

        <button
          type="button"
          className={`ifs-tab ${activeTab === 'shades' ? 'active' : ''}`}
          onClick={() => setActiveTab('shades')}
        >
          <Sparkles size={15} />
          <span>Tooth Shades</span>
          <span className="count-pill">
            {(formSettings.toothShades || []).filter((x) => x.enabled).length}
          </span>
        </button>

        <button
          type="button"
          className={`ifs-tab ${activeTab === 'custom' ? 'active' : ''}`}
          onClick={() => setActiveTab('custom')}
        >
          <Plus size={15} />
          <span>Custom Fields</span>
          <span className="count-pill">
            {(formSettings.customFields || []).length}
          </span>
        </button>
      </div>

      {/* Tab 1: Lab Instructions */}
      {activeTab === 'instructions' && (
        <div className="ifs-tab-body">
          <div className="ifs-section-head">
            <div>
              <h4>Lab Instructions (Materials &amp; Work Types)</h4>
              <p>Configure the materials and work types doctors and staff can select.</p>
            </div>
            <div className="ifs-add-bar">
              <input
                value={newInstruction}
                onChange={(e) => setNewInstruction(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addOption('labInstructions', newInstruction, setNewInstruction, 'inst');
                  }
                }}
                placeholder="Enter new lab instruction (e.g. PFM, E-Max)"
              />
              <button
                type="button"
                className="outline-btn"
                onClick={() => addOption('labInstructions', newInstruction, setNewInstruction, 'inst')}
              >
                <Plus size={15} /> Add
              </button>
            </div>
          </div>

          <div className="ifs-item-list">
            {(formSettings.labInstructions || []).map((item, idx) => (
              <div
                key={item.id}
                className={`ifs-item-row ${!item.enabled ? 'disabled-row' : ''}`}
              >
                <div className="ifs-order-controls">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveItem('labInstructions', idx, -1)}
                    title="Move up"
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    type="button"
                    disabled={idx === (formSettings.labInstructions || []).length - 1}
                    onClick={() => moveItem('labInstructions', idx, 1)}
                    title="Move down"
                  >
                    <ArrowDown size={13} />
                  </button>
                </div>

                <div className="ifs-item-content">
                  {editingItem?.id === item.id ? (
                    <div className="ifs-inline-edit">
                      <input
                        value={editingItem.name}
                        onChange={(e) =>
                          setEditingItem({ ...editingItem, name: e.target.value })
                        }
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveRename()}
                        autoFocus
                      />
                      <button type="button" onClick={handleSaveRename} title="Save rename">
                        <Check size={14} />
                      </button>
                      <button type="button" onClick={() => setEditingItem(null)} title="Cancel">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <span className="ifs-item-label">{item.name}</span>
                  )}
                  {!item.enabled && <span className="ifs-disabled-pill">Disabled</span>}
                </div>

                <div className="ifs-row-actions">
                  <button
                    type="button"
                    className="icon-action-btn"
                    onClick={() =>
                      setEditingItem({
                        category: 'labInstructions',
                        id: item.id,
                        name: item.name,
                      })
                    }
                    title="Rename option"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    className={`icon-action-btn ${item.enabled ? 'active-eye' : 'muted-eye'}`}
                    onClick={() => toggleEnabled('labInstructions', item.id)}
                    title={item.enabled ? 'Disable this option' : 'Enable this option'}
                  >
                    {item.enabled ? <Eye size={15} /> : <EyeOff size={15} />}
                  </button>
                  <button
                    type="button"
                    className="icon-action-btn danger"
                    onClick={() => deleteItem('labInstructions', item.id)}
                    title="Delete option"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="ifs-note-banner">
            <Sparkles size={16} />
            <div>
              <b>&quot;Others&quot; Option Included:</b> On the inquiry form, doctors and staff can also select <b>Others</b> to type any custom material or instruction on the fly.
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Trial Options */}
      {activeTab === 'trials' && (
        <div className="ifs-tab-body">
          <div className="ifs-section-head">
            <div>
              <h4>Trial Requirements</h4>
              <p>Configure the work trial stages required before final delivery.</p>
            </div>
            <div className="ifs-add-bar">
              <input
                value={newStage}
                onChange={(e) => setNewStage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addOption('trialOptions', newStage, setNewStage, 'trial');
                  }
                }}
                placeholder="Enter new trial option (e.g. Coping Trial)"
              />
              <button
                type="button"
                className="outline-btn"
                onClick={() => addOption('trialOptions', newStage, setNewStage, 'trial')}
              >
                <Plus size={15} /> Add
              </button>
            </div>
          </div>

          <div className="ifs-item-list">
            {(formSettings.trialOptions || []).map((item, idx) => (
              <div
                key={item.id}
                className={`ifs-item-row ${!item.enabled ? 'disabled-row' : ''}`}
              >
                <div className="ifs-order-controls">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveItem('trialOptions', idx, -1)}
                    title="Move up"
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    type="button"
                    disabled={idx === (formSettings.trialOptions || []).length - 1}
                    onClick={() => moveItem('trialOptions', idx, 1)}
                    title="Move down"
                  >
                    <ArrowDown size={13} />
                  </button>
                </div>

                <div className="ifs-item-content">
                  {editingItem?.id === item.id ? (
                    <div className="ifs-inline-edit">
                      <input
                        value={editingItem.name}
                        onChange={(e) =>
                          setEditingItem({ ...editingItem, name: e.target.value })
                        }
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveRename()}
                        autoFocus
                      />
                      <button type="button" onClick={handleSaveRename} title="Save rename">
                        <Check size={14} />
                      </button>
                      <button type="button" onClick={() => setEditingItem(null)} title="Cancel">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <span className="ifs-item-label">{item.name}</span>
                  )}
                  {!item.enabled && <span className="ifs-disabled-pill">Disabled</span>}
                </div>

                <div className="ifs-row-actions">
                  <button
                    type="button"
                    className="icon-action-btn"
                    onClick={() =>
                      setEditingItem({
                        category: 'trialOptions',
                        id: item.id,
                        name: item.name,
                      })
                    }
                    title="Rename trial option"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    className={`icon-action-btn ${item.enabled ? 'active-eye' : 'muted-eye'}`}
                    onClick={() => toggleEnabled('trialOptions', item.id)}
                    title={item.enabled ? 'Disable' : 'Enable'}
                  >
                    {item.enabled ? <Eye size={15} /> : <EyeOff size={15} />}
                  </button>
                  <button
                    type="button"
                    className="icon-action-btn danger"
                    onClick={() => deleteItem('trialOptions', item.id)}
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="ifs-note-banner">
            <Sparkles size={16} />
            <div>
              <b>Custom Entry Supported:</b> Selecting <b>Others</b> on the inquiry form displays a text field to specify any custom stage or special requirement.
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Tooth Shades */}
      {activeTab === 'shades' && (
        <div className="ifs-tab-body">
          <div className="ifs-section-head">
            <div>
              <h4>Tooth Shades (VITA Shade Guide)</h4>
              <p>Manage the preset shade options selectable during inquiry creation.</p>
            </div>
            <div className="ifs-add-bar">
              <input
                value={newShade}
                onChange={(e) => setNewShade(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addOption('toothShades', newShade, setNewShade, 'shade');
                  }
                }}
                placeholder="Enter new shade (e.g. OM3, Bleach 1)"
              />
              <button
                type="button"
                className="outline-btn"
                onClick={() => addOption('toothShades', newShade, setNewShade, 'shade')}
              >
                <Plus size={15} /> Add
              </button>
            </div>
          </div>

          <div className="ifs-item-list">
            {(formSettings.toothShades || []).map((item, idx) => (
              <div
                key={item.id}
                className={`ifs-item-row ${!item.enabled ? 'disabled-row' : ''}`}
              >
                <div className="ifs-order-controls">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveItem('toothShades', idx, -1)}
                    title="Move up"
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    type="button"
                    disabled={idx === (formSettings.toothShades || []).length - 1}
                    onClick={() => moveItem('toothShades', idx, 1)}
                    title="Move down"
                  >
                    <ArrowDown size={13} />
                  </button>
                </div>

                <div className="ifs-item-content">
                  {editingItem?.id === item.id ? (
                    <div className="ifs-inline-edit">
                      <input
                        value={editingItem.name}
                        onChange={(e) =>
                          setEditingItem({ ...editingItem, name: e.target.value })
                        }
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveRename()}
                        autoFocus
                      />
                      <button type="button" onClick={handleSaveRename} title="Save rename">
                        <Check size={14} />
                      </button>
                      <button type="button" onClick={() => setEditingItem(null)} title="Cancel">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <span className="ifs-item-label">{item.name}</span>
                  )}
                  {!item.enabled && <span className="ifs-disabled-pill">Disabled</span>}
                </div>

                <div className="ifs-row-actions">
                  <button
                    type="button"
                    className="icon-action-btn"
                    onClick={() =>
                      setEditingItem({
                        category: 'toothShades',
                        id: item.id,
                        name: item.name,
                      })
                    }
                    title="Rename"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    className={`icon-action-btn ${item.enabled ? 'active-eye' : 'muted-eye'}`}
                    onClick={() => toggleEnabled('toothShades', item.id)}
                    title={item.enabled ? 'Disable' : 'Enable'}
                  >
                    {item.enabled ? <Eye size={15} /> : <EyeOff size={15} />}
                  </button>
                  <button
                    type="button"
                    className="icon-action-btn danger"
                    onClick={() => deleteItem('toothShades', item.id)}
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Custom Fields */}
      {activeTab === 'custom' && (
        <div className="ifs-tab-body">
          <div className="ifs-section-head">
            <div>
              <h4>Additional Custom Fields</h4>
              <p>Create bespoke fields (text, textarea, dropdowns, checkboxes, or radios) for your inquiries.</p>
            </div>
            {!isAddingField && (
              <button
                type="button"
                className="primary-btn"
                onClick={handleOpenAddField}
              >
                <Plus size={15} /> Create Custom Field
              </button>
            )}
          </div>

          {/* Custom Field Builder Form */}
          {isAddingField && (
            <div className="ifs-custom-field-modal">
              <div className="ifs-modal-head">
                <h5>{editingFieldId ? 'Edit Custom Field' : 'Add New Custom Field'}</h5>
                <button
                  type="button"
                  className="close-btn"
                  onClick={() => setIsAddingField(false)}
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveCustomField} className="ifs-field-form">
                <div className="field">
                  <label>Field Name / Label <em>*</em></label>
                  <input
                    value={fieldForm.name}
                    onChange={(e) => setFieldForm({ ...fieldForm, name: e.target.value })}
                    placeholder="e.g. Impression Material, Warranty Period, Bite Registration"
                    required
                  />
                </div>

                <div className="field">
                  <label>Field Type</label>
                  <select
                    value={fieldForm.type}
                    onChange={(e) => setFieldForm({ ...fieldForm, type: e.target.value })}
                  >
                    <option value="text">Short Text (Single line)</option>
                    <option value="textarea">Long Text (Paragraph / Multiline)</option>
                    <option value="select">Dropdown (Single selection list)</option>
                    <option value="multiselect">Multiple Selection (Checkboxes)</option>
                    <option value="radio">Single Selection (Radio buttons)</option>
                  </select>
                </div>

                {/* Option Builder for Select / Multi / Radio */}
                {['select', 'multiselect', 'radio'].includes(fieldForm.type) && (
                  <div className="field ifs-options-builder">
                    <label>Available Options</label>
                    <div className="ifs-option-input-row">
                      <input
                        value={newOptionInput}
                        onChange={(e) => setNewOptionInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddOptionToField();
                          }
                        }}
                        placeholder="Add an option and press Enter (e.g. Alginate, Scan)"
                      />
                      <button
                        type="button"
                        className="outline-btn"
                        onClick={handleAddOptionToField}
                      >
                        <Plus size={14} /> Add
                      </button>
                    </div>

                    <div className="ifs-options-pills">
                      {fieldForm.options.map((opt) => (
                        <span key={opt} className="ifs-pill">
                          {opt}
                          <button
                            type="button"
                            onClick={() => handleRemoveOptionFromField(opt)}
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                      {fieldForm.options.length === 0 && (
                        <small className="muted-text">No options added yet. Type an option above and click Add.</small>
                      )}
                    </div>
                  </div>
                )}

                <div className="ifs-checkboxes-row">
                  <label className="ifs-checkbox-label">
                    <input
                      type="checkbox"
                      checked={fieldForm.required}
                      onChange={(e) => setFieldForm({ ...fieldForm, required: e.target.checked })}
                    />
                    <span>Required field on inquiry form</span>
                  </label>

                  <label className="ifs-checkbox-label">
                    <input
                      type="checkbox"
                      checked={fieldForm.enabled}
                      onChange={(e) => setFieldForm({ ...fieldForm, enabled: e.target.checked })}
                    />
                    <span>Active / Visible</span>
                  </label>
                </div>

                <div className="ifs-form-modal-actions">
                  <button
                    type="button"
                    className="outline-btn"
                    onClick={() => setIsAddingField(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="primary-btn">
                    <Check size={15} /> {editingFieldId ? 'Update Field' : 'Add Field'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* List of Created Custom Fields */}
          <div className="ifs-item-list">
            {(formSettings.customFields || []).length === 0 && !isAddingField ? (
              <div className="ifs-empty-state">
                <Sliders size={28} />
                <h5>No Custom Fields Created Yet</h5>
                <p>Add specialized inquiry fields (like scan types, warranty cards, or articulators) without touching code.</p>
                <button
                  type="button"
                  className="outline-btn"
                  onClick={handleOpenAddField}
                >
                  <Plus size={15} /> Create your first custom field
                </button>
              </div>
            ) : (
              (formSettings.customFields || []).map((field, idx) => (
                <div
                  key={field.id}
                  className={`ifs-item-row ${!field.enabled ? 'disabled-row' : ''}`}
                >
                  <div className="ifs-order-controls">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveItem('customFields', idx, -1)}
                      title="Move up"
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      type="button"
                      disabled={idx === (formSettings.customFields || []).length - 1}
                      onClick={() => moveItem('customFields', idx, 1)}
                      title="Move down"
                    >
                      <ArrowDown size={13} />
                    </button>
                  </div>

                  <div className="ifs-item-content">
                    <div className="ifs-cf-meta">
                      <b className="ifs-item-label">{field.name}</b>
                      <span className="ifs-type-pill">{field.type}</span>
                      {field.required && <span className="ifs-req-pill">Required</span>}
                      {!field.enabled && <span className="ifs-disabled-pill">Disabled</span>}
                    </div>
                    {Array.isArray(field.options) && field.options.length > 0 && (
                      <small className="ifs-cf-options-preview">
                        Options: {field.options.join(', ')}
                      </small>
                    )}
                  </div>

                  <div className="ifs-row-actions">
                    <button
                      type="button"
                      className="icon-action-btn"
                      onClick={() => handleOpenEditField(field)}
                      title="Edit field settings"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      className={`icon-action-btn ${field.enabled !== false ? 'active-eye' : 'muted-eye'}`}
                      onClick={() => toggleEnabled('customFields', field.id)}
                      title={field.enabled !== false ? 'Disable field' : 'Enable field'}
                    >
                      {field.enabled !== false ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                    <button
                      type="button"
                      className="icon-action-btn danger"
                      onClick={() => handleDeleteCustomField(field.id)}
                      title="Delete custom field"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
