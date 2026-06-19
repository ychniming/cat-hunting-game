class FocusNavigator {
    constructor(onBack, eventTarget) {
        this._onBack = onBack;
        this._eventTarget = eventTarget || (typeof document !== 'undefined' ? document : null);
        this._groups = {};
        this._activeGroupName = null;
        this._focusIndex = -1;

        this._keyHandler = (e) => this.handleKeyDown(e);
        if (this._eventTarget) {
            this._eventTarget.addEventListener('keydown', this._keyHandler);
        }
    }

    registerGroup(name, elements) {
        this._groups[name] = elements;
    }

    activateGroup(name) {
        this.clearFocus();
        this._activeGroupName = name;
        this._focusIndex = -1;

        const group = this._groups[name];
        if (!group || group.length === 0) return;

        this._focusIndex = 0;
        group[0].classList.add('focused');
    }

    clearFocus() {
        if (this._activeGroupName === null) return;
        const group = this._groups[this._activeGroupName];
        if (group && this._focusIndex >= 0 && this._focusIndex < group.length) {
            group[this._focusIndex].classList.remove('focused');
        }
        this._activeGroupName = null;
        this._focusIndex = -1;
    }

    handleKeyDown(e) {
        if (this._destroyed) return;
        if (e.repeat) return;

        const key = e.key;

        if (key === 'ArrowDown' || key === 'ArrowRight') {
            e.preventDefault();
            this._moveFocus(1);
        } else if (key === 'ArrowUp' || key === 'ArrowLeft') {
            e.preventDefault();
            this._moveFocus(-1);
        } else if (key === 'Enter') {
            e.preventDefault();
            this._triggerClick();
        } else if (key === 'Escape' || key === 'Backspace') {
            e.preventDefault();
            if (this._onBack) this._onBack();
        }
    }

    _moveFocus(direction) {
        if (this._activeGroupName === null) return;

        const group = this._groups[this._activeGroupName];
        if (!group || group.length === 0) return;

        const newIndex = this._focusIndex + direction;
        if (newIndex < 0 || newIndex >= group.length) return;

        group[this._focusIndex].classList.remove('focused');
        this._focusIndex = newIndex;
        group[this._focusIndex].classList.add('focused');
    }

    _triggerClick() {
        if (this._activeGroupName === null) return;

        const group = this._groups[this._activeGroupName];
        if (!group || this._focusIndex < 0 || this._focusIndex >= group.length) return;

        group[this._focusIndex].click();
    }

    destroy() {
        this._destroyed = true;
        if (this._eventTarget) {
            this._eventTarget.removeEventListener('keydown', this._keyHandler);
        }
    }
}

export { FocusNavigator };
