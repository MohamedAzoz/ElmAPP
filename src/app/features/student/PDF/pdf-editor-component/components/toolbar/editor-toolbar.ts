import { Component, input, output } from '@angular/core';
import type { EditorTool, ToolbarButton } from '../../models/editor.models';

@Component({
  selector: 'app-editor-toolbar',
  imports: [],
  templateUrl: './editor-toolbar.html',
  styleUrl: './editor-toolbar.css',
})
export class EditorToolbarComponent {
  /** Currently active tool (accepts signal or value) */
  activeTool = input<any>();

  /** Emits when a tool is selected */
  toolSelected = output<EditorTool>();

  /** Available toolbar buttons */
  readonly tools: ToolbarButton[] = [
    {
      tool: 'select',
      icon: 'pi pi-arrow-up-right',
      label: 'تحديد',
      tooltip: 'أداة التحديد والتحريك',
    },
    { tool: 'image', icon: 'pi pi-image', label: 'صورة', tooltip: 'إدراج صورة' },
    { tool: 'shape', icon: 'pi pi-objects-column', label: 'أشكال', tooltip: 'إدراج شكل' },
    { tool: 'draw', icon: 'pi pi-pencil', label: 'رسم', tooltip: 'الرسم الحر' },
  ];

  /** Handle tool button click */
  onToolClick(tool: EditorTool): void {
    this.toolSelected.emit(tool);
  }
}
