import { motion } from 'framer-motion';
import { BookOpen, Link as LinkIcon, Shield, Zap, Users, Music } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { AudioPlayer } from '@/components/AudioPlayer';

const educationTopics = [
  {
    id: 'why-chain',
    icon: LinkIcon,
    title: 'Why Music on Chain?',
    content: `Traditional music platforms keep ownership away from artists and audiences. When music lives on a blockchain, ownership becomes transparent, permanent, and tradeable.

Imagine owning a piece of your favorite song – not just streaming it, but actually having a stake in its success. That's what blockchain enables.

On-chain music means:
• Artists maintain control of their work
• Audiences can become true supporters and co-owners
• Royalties flow directly and transparently
• Music becomes a shared cultural asset`,
  },
  {
    id: 'why-base',
    icon: Shield,
    title: 'Why Base?',
    content: `Base is a secure, low-cost blockchain built by Coinbase. It's designed for everyday people to use blockchain without the complexity.

Why $ongChainn chose Base:
• Low fees mean more money stays with artists
• Fast transactions for seamless streaming
• Backed by Coinbase's security and trust
• Growing community of creators and collectors
• Easy onboarding through Base App

Base makes blockchain accessible to everyone – not just crypto experts.`,
  },
  {
    id: 'why-early',
    icon: Zap,
    title: 'Why Early Listening Matters',
    content: `You're not just streaming music – you're building culture.

In this Phase One Audience Edition, your listening activity:
• Establishes you as an early supporter
• Builds engagement history that unlocks future access
• Helps curate and surface quality music
• Creates a foundation for community ownership

When ownership features activate in later phases, early audience members will have proven their commitment through listening behavior.

Your plays, likes, and shares today shape what $ongChainn becomes tomorrow.`,
  },
  {
    id: 'town-squares',
    icon: Users,
    title: 'What are Town Squares?',
    content: `Town Squares are geographic communities within Create On Base – hubs where artists and audiences come together around shared cultural identity.

Livingstone Town Square (Zambia) is the pioneer chapter:
• First Town Square in the $ongChainn ecosystem
• Showcasing Zambian artists to a global audience
• Building a model for other communities worldwide

More Town Squares will launch as the platform grows, each representing a unique musical culture and community.`,
  },
  {
    id: 'phases',
    icon: Music,
    title: 'Platform Phases',
    content: `$ongChainn is built in intentional phases:

Phase One (Current) – Audience Edition
• Music discovery and streaming
• Community participation
• Engagement tracking
• Education

Phase Two – Ownership Begins
• Song minting and collection
• Artist-audience direct relationships
• Early supporter rewards

Phase Three – Full Economy
• Token-based rewards
• Governance participation
• Advanced ownership features

Each phase builds on proven audience behavior and community trust.`,
  },
];

export default function Education() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <Navigation />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <BookOpen className="w-4 h-4" />
            <span className="text-sm font-medium">Education Hub</span>
          </div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            Understanding $ongChainn
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Learn why decentralized music matters, how Base powers our platform, 
            and why your early participation shapes the future.
          </p>
        </motion.section>

        {/* Topics */}
        <div className="space-y-6">
          {educationTopics.map((topic, index) => (
            <motion.article
              key={topic.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card rounded-2xl p-6 md:p-8 border border-border"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <topic.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="font-heading text-xl font-semibold text-foreground mb-4">
                    {topic.title}
                  </h2>
                  <div className="prose prose-invert prose-sm max-w-none">
                    {topic.content.split('\n\n').map((paragraph, i) => (
                      <p key={i} className="text-muted-foreground mb-3 last:mb-0 whitespace-pre-line">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center"
        >
          <p className="text-muted-foreground mb-4">
            Ready to start building your listening history?
          </p>
          <a 
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-primary text-primary-foreground font-medium shadow-glow hover:scale-105 transition-transform"
          >
            <Music className="w-4 h-4" />
            Start Listening
          </a>
        </motion.div>
      </main>

      <AudioPlayer />
    </div>
  );
}
