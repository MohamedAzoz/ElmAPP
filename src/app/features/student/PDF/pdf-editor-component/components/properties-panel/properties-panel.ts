import { Component, input, output, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { Annotation, ElementProperties, TextAlign } from '../../models/editor.models';

@Component({
  selector: 'app-properties-panel',
  imports: [FormsModule],
  templateUrl: './properties-panel.html',
  styleUrl: './properties-panel.css',
  host: {
    '[class.collapsed]': '!isOpen()',
  },
})
export class PropertiesPanelComponent {
  /** The currently selected annotation */
  selectedAnnotation = input<any>(null);

  /** Current page number */
  currentPage = input<any>(1);

  /** Total pages */
  totalPages = input<any>(0);

  /** Whether panel is open */
  isOpen = input<any>(true);

  /** Emits updated properties */
  propertiesChanged = output<Partial<Annotation>>();

  /** Emits when ordering is changed */
  orderChanged = output<'forward' | 'backward'>();

  /** Emits panel toggle */
  togglePanel = output<void>();

  /** Available font families */
  readonly fontFamilies = [
    'IBM Plex Sans Arabic',
    'Cairo',
    'Rubik',
    'Arial',
    'Times New Roman',
    'Courier New',
  ];

  /** Available font sizes */
  readonly fontSizes = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72];

  /** Whether an annotation is selected */
  hasSelection = computed(() => this.selectedAnnotation() !== null);

  /** Current properties derived from the selected annotation */
  currentProps = computed<ElementProperties>(() => {
    const ann = this.selectedAnnotation();
    return {
      fontFamily: ann?.fontFamily || 'IBM Plex Sans Arabic',
      fontSize: ann?.fontSize || 18,
      fontWeight: ann?.fontWeight || '400',
      color: ann?.color || '#141b2b',
      textAlign: (ann?.textAlign as TextAlign) || 'right',
      opacity: ann?.opacity ?? 1,
    };
  });

  /** Toggle bold weight */
  toggleBold(): void {
    const current = this.currentProps().fontWeight;
    this.propertiesChanged.emit({
      fontWeight: current === '700' ? '400' : '700',
    });
  }

  /** Change font family */
  onFontFamilyChange(family: string): void {
    this.propertiesChanged.emit({ fontFamily: family });
  }

  /** Change font size */
  onFontSizeChange(size: number): void {
    this.propertiesChanged.emit({ fontSize: size });
  }

  /** Change text color */
  onColorChange(color: string): void {
    this.propertiesChanged.emit({ color });
  }

  /** Change text alignment */
  onAlignChange(align: TextAlign): void {
    this.propertiesChanged.emit({ textAlign: align });
  }

  /** Change text content */
  onTextChange(content: string): void {
    this.propertiesChanged.emit({ content });
  }

  /** Move selected annotation layer forward */
  moveForward(): void {
    this.orderChanged.emit('forward');
  }

  /** Move selected annotation layer backward */
  moveBackward(): void {
    this.orderChanged.emit('backward');
  }

  /** Toggle panel visibility */
  onToggle(): void {
    this.togglePanel.emit();
  }
}
