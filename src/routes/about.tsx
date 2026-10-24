import { createFileRoute } from '@tanstack/react-router'
import { Hammer, Heart, Smartphone, TreePine, TriangleAlert, Users } from 'lucide-react'

import { Logo, PageBanner, SectionCard } from '@/components/app-shell'

export const Route = createFileRoute('/about')({
  head: () => ({ meta: [{ title: 'About Us · GlowBots' }] }),
  component: AboutPage,
})

const SECTIONS = [
  {
    icon: Users,
    title: 'Who we are',
    body: 'Hey! We are the Avonwood Glowbots, a FIRST LEGO League team from Avon, CT, and this season our project focused on protecting our local environment through community action and innovative engineering.',
  },
  {
    icon: TreePine,
    title: 'Our outreach',
    body: 'As part of our outreach, we volunteered in the removal of Japanese barberry, an invasive plant that spreads aggressively, forms dense thorny patches, and makes it harder for native plants and animals to survive.',
  },
  {
    icon: TriangleAlert,
    title: 'Why invasive plant removal matters',
    body: 'Invasive plants are species that do not naturally belong in an area and grow so quickly and widely that they crowd out native plants, reduce biodiversity, and disrupt the balance of the ecosystem.',
  },
  {
    icon: Smartphone,
    title: 'Our app',
    body: 'While working in the field, we realized that many people struggle to identify invasive plants, so we designed an app that lets you take a photo of any plant you find. The app scans the image, analyzes its shape, color, and leaf patterns, and then tells you whether the plant is native or invasive.',
  },
  {
    icon: Hammer,
    title: 'Our shrub remover',
    body: 'Along with the app, we also engineered our own shrub remover tool to help safely pull out invasive shrubs from the ground, making removal easier, faster, and more accessible for volunteers.',
  },
]

function AboutPage() {
  return (
    <div className="pb-14">
      <PageBanner
        icon={
          <div className="mb-2 rounded-full ring-4 ring-white shadow-lg">
            <Logo size={130} />
          </div>
        }
        title="Avonwood GlowBots"
        subtitle="FIRST LEGO League team  |  Avon, CT"
      />
      <div className="mx-auto mt-6 grid max-w-4xl gap-5 px-4 md:grid-cols-2">
        {SECTIONS.map((s) => (
          <SectionCard key={s.title} icon={s.icon} title={s.title}>
            <p className="text-sm leading-relaxed">{s.body}</p>
          </SectionCard>
        ))}
        <SectionCard icon={Heart} title="Our goal">
          <p className="text-sm leading-relaxed">
            Our goal is to empower our community with both knowledge and tools so everyone can help protect the
            environment we all share.
          </p>
          <p className="mt-3 font-display font-bold italic text-forest">Heartily, The Avonwood GlowBots</p>
        </SectionCard>
      </div>
    </div>
  )
}
