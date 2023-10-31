import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { NuverialIconComponent } from '../icon';

interface TreeNode {
  children: TreeNode[];
  expanded: boolean;
  icon?: string;
  key: string;
  label: string;
  selected?: boolean;
}

/**
 * Nuverial Tree Component
 *
 * The tree component provides display for an generic n-ary tree in a nested list fashion.
 * Users can select a tree node, which triggers the `select` event emitter to output the full
 * path from the root node to the selected node. Each internal node can also be collapsed to hide its children.
 *
 * The tree must have a single root node
 * Example structure:
 * - Root
 *   - Child 1
 *     - Child 1.1
 *     - Child 1.2
 *   - Child 2
 *     - Child 2.1
 *   - Child 3
 *
 * ## Usage
 *
 * ```html
 *   <nuverial-tree
 *     [root]="treeRoot"
 *     (nodeSelected)="onNodeSelected($event)">
 *   </nuverial-tree>
 * ```
 *
 * - `[root]`: The root node of the tree to be displayed.
 * - `(actionSelected)`: Event emitter containing the path from the root to the selected node (e.g. root.child1.child2).
 *
 * The `root` input should be of type `TreeNode`, which has the following properties:
 * - `children`: An array of child nodes.
 * - `expanded`: Whether the should show its children (only relevant for internal nodes)
 * - `icon`: The icon to be shown next to the label
 * - `key`: A unique identifier for the node.
 * - `parent`: The parent node of the current node.
 * - `label`: The label to be displayed for the node.
 *
 * The tree automatically styles the leaf or internal nodes which are determined by the number of children.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NuverialIconComponent],
  selector: 'nuverial-tree',
  standalone: true,
  styleUrls: ['./tree.component.scss'],
  templateUrl: './tree.component.html',
})
export class NuverialTreeComponent {
  /**
   * The root node of the tree to be displayed
   */
  @Input()
  public root!: TreeNode;

  /**
   * Event emitter containing the path from the root to the selected node (e.g. root.child1.child2)
   */
  @Output() public readonly nodeSelected: EventEmitter<string> = new EventEmitter<string>();

  private selectedNode?: TreeNode;

  constructor(private readonly _changeDetectorRef: ChangeDetectorRef) {}

  public onSelect(node: TreeNode): void {
    if (this.selectedNode) {
      this.selectedNode.selected = false;
    }

    this.selectedNode = node;
    this.selectedNode.selected = true;
    const fullSchemaKey = this.findFullSchemaKey(this.selectedNode, this.root);

    this.nodeSelected.emit(fullSchemaKey);
  }

  private findFullSchemaKey(selectedNode: TreeNode, root: TreeNode): string {
    if (selectedNode === root) {
      return selectedNode.key;
    }

    for (const child of root.children) {
      const foundKey = this.findFullSchemaKey(selectedNode, child);

      if (foundKey) {
        return `${root.key}.${foundKey}`;
      }
    }

    return '';
  }

  public toggleExpanded(node: TreeNode): void {
    node.expanded = !node.expanded;
    this._changeDetectorRef.markForCheck();
  }

  public trackByFn(index: number): number {
    return index;
  }
}
