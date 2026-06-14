const cron = require('node-cron');
const { supabase } = require('../index.js');

/**
 * This cron job runs every hour to find videos older than 24 hours,
 * update their status to 'expired', and delete the corresponding file from storage.
 */
const autoDeleteExpiredVideos = cron.schedule('0 * * * *', async () => {
  console.log('Running hourly cron job: Checking for expired videos...');

  // Calculate the timestamp for 24 hours ago in ISO format
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  try {
    // 1. Find all video jobs that are older than 24 hours and not already marked as 'expired'
    const { data: expiredJobs, error: queryError } = await supabase
      .from('video_jobs')
      .select('id, outputUrl') // We need the ID to update and the URL to delete
      .lt('created_at', twentyFourHoursAgo)
      .neq('status', 'expired');

    if (queryError) {
      console.error('Error querying for expired videos:', queryError.message);
      return;
    }

    if (!expiredJobs || expiredJobs.length === 0) {
      console.log('Cron job ran: No expired videos found.');
      return;
    }

    console.log(`Found ${expiredJobs.length} expired video(s). Starting cleanup...`);

    // Process each expired job
    for (const job of expiredJobs) {
      console.log(`Processing job ID: ${job.id}`);

      // 2. Update the database status to 'expired' FIRST to prevent re-processing
      const { error: updateError } = await supabase
        .from('video_jobs')
        .update({ status: 'expired', updatedAt: new Date() })
        .eq('id', job.id);

      if (updateError) {
        console.error(`Failed to update status for job ${job.id}:`, updateError.message);
        // Skip this job and try again on the next run to avoid orphaning the file
        continue;
      }

      console.log(`Successfully marked job ${job.id} as expired.`);

      // 3. If a file path exists, delete the physical file from Supabase Storage
      if (job.outputUrl) {
        // The path in the bucket is often the part of the URL after the bucket name/id.
        // This logic might need adjustment based on how the URL is stored.
        // For this example, we assume `outputUrl` is the direct file path for removal.
        const filePath = job.outputUrl;
        console.log(`Attempting to delete file from storage: ${filePath}`);

        const { error: fileDeleteError } = await supabase
          .storage
          .from('videos') // The name of your storage bucket
          .remove([filePath]);

        if (fileDeleteError) {
          // Log the error. The file is now an orphan. Manual cleanup might be needed.
          console.error(`Error deleting file ${filePath} for job ${job.id}:`, fileDeleteError.message);
        } else {
          console.log(`Successfully deleted file ${filePath} from storage.`);
          // Optionally, clear the outputUrl from the database record after successful deletion
          await supabase.from('video_jobs').update({ outputUrl: null }).eq('id', job.id);
        }
      } else {
        console.log(`Job ID ${job.id} has no outputUrl. No file to delete.`);
      }
    }

    console.log('Cron job finished cleanup process.');

  } catch (error) {
    console.error('An unexpected error occurred during the cron job execution:', error.message);
  }
});

// Export the job so it can be started in the main server file
module.exports = { autoDeleteExpiredVideos };
