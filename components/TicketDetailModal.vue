<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 overflow-y-auto"
        @click.self="close"
      >
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-black/50 transition-opacity"
          @click="close"
        ></div>

        <!-- Modal -->
        <div class="flex min-h-full items-center justify-center p-4">
          <div
            class="relative bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
            @click.stop
          >
            <!-- Header -->
            <div
              class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-start justify-between"
            >
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-3 mb-2">
                  <h2 class="text-2xl font-bold text-gray-900">
                    {{ ticket.key }}
                  </h2>
                  <span
                    class="px-3 py-1 rounded-full text-sm font-semibold text-white"
                    :style="{ backgroundColor: statusColor }"
                  >
                    {{ ticket.currentStatus }}
                  </span>
                  <span
                    v-if="ticket.points"
                    class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold"
                  >
                    {{ ticket.points }} pts
                  </span>
                </div>
                <h3 class="text-lg text-gray-700 font-medium">
                  {{ ticket.title }}
                </h3>
              </div>

              <button
                @click="close"
                class="text-gray-400 hover:text-gray-600 transition-colors ml-4"
              >
                <svg
                  class="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <!-- Body -->
            <div class="px-6 py-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <!-- Assignee Info -->
              <div class="mb-6">
                <h4 class="text-sm font-semibold text-gray-500 uppercase mb-2">
                  Assignee
                </h4>
                <div class="flex items-center gap-3">
                  <div
                    v-if="ticket.assignee.avatarUrl"
                    class="w-10 h-10 rounded-full bg-gray-200 overflow-hidden"
                  >
                    <img
                      :src="ticket.assignee.avatarUrl"
                      :alt="ticket.assignee.name"
                      class="w-full h-full object-cover"
                    />
                  </div>
                  <div
                    v-else
                    class="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold"
                  >
                    {{ getUserInitials(ticket.assignee.name) }}
                  </div>
                  <div>
                    <div class="font-medium text-gray-900">
                      {{ ticket.assignee.name }}
                    </div>
                    <div class="text-sm text-gray-500">
                      {{ ticket.assignee.email }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Timeline -->
              <div class="mb-6">
                <h4 class="text-sm font-semibold text-gray-500 uppercase mb-3">
                  Timeline
                </h4>
                <div class="space-y-3">
                  <div class="flex items-center gap-3 text-sm">
                    <span class="text-gray-500 w-24">Started:</span>
                    <span class="font-medium text-gray-900">{{
                      formatDate(ticket.startDate, 'MMM d, yyyy h:mm a')
                    }}</span>
                  </div>
                  <div
                    v-if="ticket.endDate"
                    class="flex items-center gap-3 text-sm"
                  >
                    <span class="text-gray-500 w-24">Completed:</span>
                    <span class="font-medium text-gray-900">{{
                      formatDate(ticket.endDate, 'MMM d, yyyy h:mm a')
                    }}</span>
                  </div>
                  <div v-else class="flex items-center gap-3 text-sm">
                    <span class="text-gray-500 w-24">Status:</span>
                    <span class="font-medium text-blue-600">In Progress</span>
                  </div>
                </div>

                <!-- Status History -->
                <div v-if="ticket.statusHistory.length > 0" class="mt-4">
                  <h5
                    class="text-xs font-semibold text-gray-500 uppercase mb-2"
                  >
                    Status Changes
                  </h5>
                  <div class="relative pl-6 space-y-3">
                    <div
                      v-for="(change, index) in ticket.statusHistory"
                      :key="index"
                      class="relative"
                    >
                      <div
                        class="absolute left-[-24px] w-3 h-3 rounded-full border-2 border-white"
                        :style="{
                          backgroundColor: getStatusColor(change.status),
                        }"
                      ></div>
                      <div
                        v-if="index < ticket.statusHistory.length - 1"
                        class="absolute left-[-18px] top-3 w-0.5 h-full bg-gray-200"
                      ></div>
                      <div class="text-sm">
                        <div class="font-medium text-gray-900">
                          {{ change.status }}
                        </div>
                        <div class="text-xs text-gray-500">
                          {{
                            formatDate(change.timestamp, 'MMM d, yyyy h:mm a')
                          }}
                          <span v-if="change.author">
                            by {{ change.author.name }}</span
                          >
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Description -->
              <div v-if="ticket.description" class="mb-6">
                <h4 class="text-sm font-semibold text-gray-500 uppercase mb-2">
                  Description
                </h4>
                <div
                  class="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg prose prose-sm max-w-none"
                  v-html="formattedDescription"
                ></div>
              </div>

              <!-- Linked Pull Requests -->
              <div class="mb-4">
                <h4 class="text-sm font-semibold text-gray-500 uppercase mb-3">
                  Linked Pull Requests ({{ ticket.prs.length }})
                </h4>

                <div
                  v-if="ticket.prs.length === 0"
                  class="text-sm text-gray-500 italic"
                >
                  No pull requests linked to this ticket
                </div>

                <div v-else class="space-y-3">
                  <a
                    v-for="pr in ticket.prs"
                    :key="pr.number"
                    :href="pr.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
                  >
                    <div class="flex items-start justify-between gap-4">
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1">
                          <span class="text-sm font-semibold text-gray-900"
                            >#{{ pr.number }}</span
                          >
                          <span
                            class="px-2 py-0.5 rounded-full text-xs font-medium"
                            :class="{
                              'bg-green-100 text-green-800':
                                pr.status === 'merged',
                              'bg-red-100 text-red-800': pr.status === 'closed',
                              'bg-blue-100 text-blue-800': pr.status === 'open',
                            }"
                          >
                            {{ pr.status }}
                          </span>
                        </div>
                        <div class="text-sm text-gray-700 mb-2">
                          {{ pr.title }}
                        </div>
                        <div
                          class="flex items-center gap-4 text-xs text-gray-500"
                        >
                          <div class="flex items-center gap-1">
                            <img
                              v-if="pr.authorAvatarUrl"
                              :src="pr.authorAvatarUrl"
                              :alt="pr.author"
                              class="w-4 h-4 rounded-full"
                            />
                            <span>{{ pr.author }}</span>
                          </div>
                          <span
                            >Created
                            {{ formatDate(pr.createdAt, 'MMM d, yyyy') }}</span
                          >
                          <span v-if="pr.mergedAt"
                            >Merged
                            {{ formatDate(pr.mergedAt, 'MMM d, yyyy') }}</span
                          >
                        </div>
                      </div>
                      <svg
                        class="w-5 h-5 text-gray-400 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </div>
                  </a>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div
              class="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between items-center"
            >
              <a
                :href="ticket.jiraUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
              >
                View in JIRA
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
              <button @click="close" class="btn-secondary">Close</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Ticket } from '~/types';

const props = defineProps<{
  isOpen: boolean;
  ticket: Ticket | null;
}>();

const emit = defineEmits<{
  close: [];
}>();

const { getStatusColor } = useConfig();
const { formatDate } = useDateUtils();

const statusColor = computed(() => {
  return props.ticket ? getStatusColor(props.ticket.currentStatus) : '#8b5cf6';
});

const getUserInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const close = () => {
  emit('close');
};

// Convert Atlassian Document Format (ADF) to HTML
const renderAdf = (doc: any): string => {
  if (!doc) return '';
  if (typeof doc === 'string') return escapeHtml(doc);
  if (doc.type === 'doc' && doc.content) {
    return doc.content.map(renderAdfNode).join('');
  }
  // If it's not ADF, just show as text
  return escapeHtml(
    typeof doc === 'object' ? JSON.stringify(doc) : String(doc)
  );
};

const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

const renderAdfNode = (node: any): string => {
  if (!node) return '';

  switch (node.type) {
    case 'paragraph':
      if (!node.content) return '<p class="mb-2">&nbsp;</p>';
      return `<p class="mb-2">${renderInlineContent(node.content)}</p>`;

    case 'heading': {
      const level = node.attrs?.level || 3;
      const tag = `h${level}`;
      const sizeClass =
        level === 1 ? 'text-xl' : level === 2 ? 'text-lg' : 'text-base';
      return `<${tag} class="${sizeClass} font-bold mb-2 mt-3">${renderInlineContent(
        node.content || []
      )}</${tag}>`;
    }

    case 'bulletList':
      return `<ul class="list-disc ml-5 mb-2 space-y-1">${(node.content || [])
        .map(renderAdfNode)
        .join('')}</ul>`;

    case 'orderedList':
      return `<ol class="list-decimal ml-5 mb-2 space-y-1" start="${
        node.attrs?.order || 1
      }">${(node.content || []).map(renderAdfNode).join('')}</ol>`;

    case 'listItem':
      return `<li>${(node.content || []).map(renderAdfNode).join('')}</li>`;

    case 'codeBlock':
      return `<pre class="bg-gray-800 text-gray-100 p-3 rounded-md mb-2 overflow-x-auto text-xs"><code>${escapeHtml(
        (node.content || []).map((c: any) => c.text || '').join('')
      )}</code></pre>`;

    case 'blockquote':
      return `<blockquote class="border-l-4 border-gray-300 pl-4 italic text-gray-600 mb-2">${(
        node.content || []
      )
        .map(renderAdfNode)
        .join('')}</blockquote>`;

    case 'rule':
      return '<hr class="my-3 border-gray-300" />';

    case 'table':
      return `<table class="w-full border-collapse mb-2 text-sm"><tbody>${(
        node.content || []
      )
        .map(renderAdfNode)
        .join('')}</tbody></table>`;

    case 'tableRow':
      return `<tr>${(node.content || []).map(renderAdfNode).join('')}</tr>`;

    case 'tableHeader':
      return `<th class="border border-gray-300 px-2 py-1 bg-gray-100 font-semibold text-left">${(
        node.content || []
      )
        .map(renderAdfNode)
        .join('')}</th>`;

    case 'tableCell':
      return `<td class="border border-gray-300 px-2 py-1">${(
        node.content || []
      )
        .map(renderAdfNode)
        .join('')}</td>`;

    case 'mediaSingle':
    case 'media':
      return '<p class="text-gray-400 italic text-xs">[media attachment]</p>';

    case 'panel': {
      const panelType = node.attrs?.panelType || 'info';
      const panelColors: Record<string, string> = {
        info: 'bg-blue-50 border-blue-200',
        note: 'bg-yellow-50 border-yellow-200',
        warning: 'bg-orange-50 border-orange-200',
        error: 'bg-red-50 border-red-200',
        success: 'bg-green-50 border-green-200',
      };
      return `<div class="border rounded-md p-3 mb-2 ${
        panelColors[panelType] || panelColors.info
      }">${(node.content || []).map(renderAdfNode).join('')}</div>`;
    }

    default:
      if (node.content) {
        return (node.content as any[]).map(renderAdfNode).join('');
      }
      return '';
  }
};

const renderInlineContent = (content: any[]): string => {
  return content
    .map((node: any) => {
      if (node.type === 'text') {
        let text = escapeHtml(node.text || '');
        if (node.marks) {
          for (const mark of node.marks) {
            switch (mark.type) {
              case 'strong':
                text = `<strong class="font-semibold">${text}</strong>`;
                break;
              case 'em':
                text = `<em>${text}</em>`;
                break;
              case 'underline':
                text = `<span class="underline">${text}</span>`;
                break;
              case 'strike':
                text = `<span class="line-through">${text}</span>`;
                break;
              case 'code':
                text = `<code class="bg-gray-200 text-red-600 px-1.5 py-0.5 rounded text-xs font-mono">${text}</code>`;
                break;
              case 'link':
                text = `<a href="${escapeHtml(
                  mark.attrs?.href || '#'
                )}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${text}</a>`;
                break;
              case 'textColor':
                text = `<span style="color: ${escapeHtml(
                  mark.attrs?.color || 'inherit'
                )}">${text}</span>`;
                break;
            }
          }
        }
        return text;
      }
      if (node.type === 'hardBreak') return '<br />';
      if (node.type === 'mention') {
        return `<span class="text-blue-600 font-medium">@${escapeHtml(
          node.attrs?.text || 'user'
        )}</span>`;
      }
      if (node.type === 'emoji') {
        return node.attrs?.shortName || '';
      }
      if (node.type === 'inlineCard') {
        return `<a href="${escapeHtml(
          node.attrs?.url || '#'
        )}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${escapeHtml(
          node.attrs?.url || 'link'
        )}</a>`;
      }
      return '';
    })
    .join('');
};

const formattedDescription = computed(() => {
  if (!props.ticket?.description) return '';
  return renderAdf(props.ticket.description);
});
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.3s ease;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.95);
}
</style>
