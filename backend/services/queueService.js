import crypto from "crypto";

class TaskQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.processedTasks = new Map(); // dedupKey/hash -> timestamp
    
    // Periodically clean up processed tasks cache to prevent memory leaks
    this.cleanupInterval = setInterval(() => this.cleanupDedupCache(), 60000); 
  }

  cleanupDedupCache() {
    const now = Date.now();
    const FIVE_MINUTES = 5 * 60 * 1000;
    for (const [key, timestamp] of this.processedTasks.entries()) {
      if (now - timestamp > FIVE_MINUTES) {
        this.processedTasks.delete(key);
      }
    }
  }

  getDedupKey(task) {
    // Prefer an explicit, caller-provided dedup key so legitimate repeat sends
    // (e.g. an admin manually re-sending a confirmation) are NOT suppressed by
    // hashing identical content. Only fall back to a content hash when no
    // explicit key is supplied.
    if (task.dedupKey) return task.dedupKey;
    const contents = `${task.type}-${JSON.stringify(task.recipient)}-${task.title}-${task.body}`;
    return crypto.createHash("md5").update(contents).digest("hex");
  }

  /**
   * Enqueues a notification task.
   * @param {object} task - Task details: { type, recipient, title, body, data, dedupKey }
   * @returns {Promise<boolean>} True if enqueued, false if skipped as duplicate
   */
  async enqueue(task) {
    const dedupKey = this.getDedupKey(task);
    const now = Date.now();

    // Prevent duplicates
    if (this.processedTasks.has(dedupKey)) {
      console.log(`[Queue Service] Task skipped (duplicate prevention): Key = ${dedupKey}`);
      return false;
    }

    this.processedTasks.set(dedupKey, now);

    const queueItem = {
      id: crypto.randomUUID(),
      type: task.type,
      recipient: task.recipient,
      title: task.title,
      body: task.body,
      data: task.data || {},
      retries: 3,
      dedupKey,
      createdAt: now
    };

    this.queue.push(queueItem);
    console.log(`[Queue Service] Task enqueued: ID = ${queueItem.id}, Type = ${queueItem.type}, Recipient = ${typeof queueItem.recipient === 'string' ? queueItem.recipient : queueItem.recipient.length + ' tokens'}`);

    this.processQueue();
    return true;
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    
    // Process up to 5 tasks concurrently
    const batchSize = Math.min(this.queue.length, 5);
    const tasksToProcess = this.queue.splice(0, batchSize);

    await Promise.all(tasksToProcess.map(task => this.executeTask(task)));

    this.processing = false;

    // Trigger next batch in 500ms
    setTimeout(() => this.processQueue(), 500);
  }

  async executeTask(task) {
    const recipientLabel =
      typeof task.recipient === "string"
        ? task.recipient
        : `${task.recipient?.length || 0} token(s)`;
    try {
      if (task.type === "email") {
        console.log(
          `[Queue Service] Email trigger | ID=${task.id} | recipient=${recipientLabel} | subject="${task.title}"`
        );
        const { sendMailDirect } = await import("./mailService.js");
        const info = await sendMailDirect({
          to: task.recipient,
          subject: task.title,
          html: task.body,
          text: task.data.text || task.title
        });
        console.log(
          `[Queue Service] Email task completed | ID=${task.id} | status=SUCCESS | messageId=${info?.messageId || "n/a"}`
        );
        return;
      } else if (task.type === "push") {
        console.log(`[Queue Service] Push trigger | ID=${task.id} | recipient=${recipientLabel}`);
        const { sendPushDirect } = await import("./fcmService.js");
        await sendPushDirect(task.recipient, task.title, task.body, task.data);
      }
      console.log(`[Queue Service] Task completed successfully: ID = ${task.id}`);
    } catch (error) {
      console.error(
        `[Queue Service] Task FAILED | ID=${task.id} | type=${task.type} | recipient=${recipientLabel} | status=FAILURE | reason=${error.message}`
      );

      if (task.retries > 0) {
        task.retries--;
        // Re-enqueue for retry
        this.queue.push(task);
        console.log(`[Queue Service] Task scheduled for retry (${3 - task.retries}/3): ID = ${task.id}`);
      } else {
        console.error(
          `[Queue Service] Task failed PERMANENTLY (giving up) | ID=${task.id} | recipient=${recipientLabel}`
        );
      }
    }
  }
}

export const queueService = new TaskQueue();
