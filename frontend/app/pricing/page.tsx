'use client';

import Link from 'next/link';
import { FileText, Check, Zap, Shield, Brain, Users, ArrowRight } from 'lucide-react';

const plans = [
    {
        name: 'Free',
        description: 'Perfect for occasional use',
        price: '$0',
        period: 'forever',
        features: [
            '5 documents per day',
            'Basic PDF tools (merge, split, rotate)',
            'Standard compression',
            'Max 10MB file size',
            'Watermarked outputs',
            'Community support',
        ],
        notIncluded: [
            'AI-powered features',
            'OCR scanning',
            'Priority processing',
            'API access',
        ],
        cta: 'Get Started',
        href: '/register',
        popular: false,
    },
    {
        name: 'Pro',
        description: 'For professionals and small teams',
        price: '$12',
        period: 'per month',
        features: [
            'Unlimited documents',
            'All 70+ PDF tools',
            'AI summarization & chat',
            'OCR (100+ languages)',
            'Max 100MB file size',
            'No watermarks',
            'Priority processing',
            'Email support',
            'Cloud storage integration',
        ],
        notIncluded: [
            'API access',
            'Team collaboration',
        ],
        cta: 'Start Free Trial',
        href: '/register?plan=pro',
        popular: true,
    },
    {
        name: 'Enterprise',
        description: 'For organizations with advanced needs',
        price: '$49',
        period: 'per user/month',
        features: [
            'Everything in Pro',
            'Unlimited file size',
            'Full API access',
            'Team collaboration',
            'SSO / SAML authentication',
            'Custom branding',
            'Dedicated support',
            'SLA guarantee (99.9%)',
            'On-premise deployment option',
            'Custom integrations',
        ],
        notIncluded: [],
        cta: 'Contact Sales',
        href: '/contact',
        popular: false,
    },
];

const faqs = [
    {
        question: 'Can I cancel anytime?',
        answer: 'Yes! You can cancel your subscription at any time. Your access will continue until the end of your billing period.',
    },
    {
        question: 'Is there a free trial?',
        answer: 'Yes, Pro plan comes with a 14-day free trial. No credit card required to start.',
    },
    {
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit cards, PayPal, and wire transfers for Enterprise plans.',
    },
    {
        question: 'Are my files secure?',
        answer: 'Absolutely. We use AES-256 encryption and automatically delete all files after processing. We are SOC 2 Type II compliant.',
    },
    {
        question: 'Do you offer discounts for non-profits or education?',
        answer: 'Yes! We offer 50% off for verified non-profit organizations and educational institutions. Contact us for details.',
    },
    {
        question: 'Can I switch plans?',
        answer: 'Yes, you can upgrade or downgrade at any time. Changes take effect immediately, and we\'ll prorate your billing.',
    },
];

export default function PricingPage() {
    return (
        <main className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                DocuForge
                            </span>
                        </Link>

                        <div className="hidden md:flex items-center space-x-8">
                            <Link href="/tools" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
                                All Tools
                            </Link>
                            <Link href="/pricing" className="text-blue-600 font-medium">
                                Pricing
                            </Link>
                            <Link href="/api-docs" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
                                API
                            </Link>
                            <Link href="/login" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
                                Login
                            </Link>
                            <Link
                                href="/register"
                                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                            >
                                Get Started Free
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="pt-32 pb-16 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                        Simple, Transparent Pricing
                    </h1>
                    <p className="text-xl text-gray-600 mb-8">
                        Choose the plan that fits your needs. Start free, upgrade when you're ready.
                    </p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        <Check className="w-4 h-4" />
                        14-day free trial on Pro plan
                    </div>
                </div>
            </section>

            {/* Pricing Cards */}
            <section className="pb-20 px-4">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan) => (
                        <div
                            key={plan.name}
                            className={`relative bg-white rounded-2xl shadow-lg overflow-hidden ${plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-center py-2 text-sm font-medium">
                                    Most Popular
                                </div>
                            )}
                            <div className={`p-8 ${plan.popular ? 'pt-14' : ''}`}>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                                <p className="text-gray-600 mb-6">{plan.description}</p>
                                <div className="mb-6">
                                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                                    <span className="text-gray-600 ml-2">/{plan.period}</span>
                                </div>
                                <Link
                                    href={plan.href}
                                    className={`block w-full py-3 rounded-lg font-medium text-center transition-all ${plan.popular
                                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg'
                                            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                        }`}
                                >
                                    {plan.cta}
                                </Link>
                            </div>
                            <div className="border-t border-gray-100 p-8">
                                <p className="text-sm font-semibold text-gray-900 mb-4">What's included:</p>
                                <ul className="space-y-3">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-start gap-3">
                                            <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                            <span className="text-gray-600">{feature}</span>
                                        </li>
                                    ))}
                                    {plan.notIncluded.map((feature) => (
                                        <li key={feature} className="flex items-start gap-3 opacity-50">
                                            <span className="w-5 h-5 flex items-center justify-center text-gray-400">—</span>
                                            <span className="text-gray-400">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features Comparison */}
            <section className="py-20 px-4 bg-white">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
                        Why Choose DocuForge?
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <Zap className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Lightning Fast</h3>
                                <p className="text-gray-600">Process documents in seconds, not minutes. Our optimized infrastructure ensures quick turnaround.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                                <Shield className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Bank-Level Security</h3>
                                <p className="text-gray-600">AES-256 encryption, automatic file deletion, and SOC 2 compliance for your peace of mind.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                                <Brain className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">AI-Powered</h3>
                                <p className="text-gray-600">Leverage cutting-edge AI for summarization, translation, and intelligent document processing.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                                <Users className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Team Collaboration</h3>
                                <p className="text-gray-600">Share, collaborate, and manage permissions with your team effortlessly.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-20 px-4">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-6">
                        {faqs.map((faq) => (
                            <div key={faq.question} className="bg-white rounded-xl p-6 shadow-sm">
                                <h3 className="font-semibold text-gray-900 mb-2">{faq.question}</h3>
                                <p className="text-gray-600">{faq.answer}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                        Ready to Get Started?
                    </h2>
                    <p className="text-xl text-blue-100 mb-8">
                        Join thousands of professionals who trust DocuForge for their document needs.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/register"
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:shadow-lg transition-all"
                        >
                            Start Free Trial
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link
                            href="/contact"
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white text-white rounded-xl font-semibold hover:bg-white/10 transition-all"
                        >
                            Contact Sales
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 py-12 px-4">
                <div className="max-w-6xl mx-auto text-center">
                    <div className="flex items-center justify-center space-x-2 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white">DocuForge</span>
                    </div>
                    <p className="mb-6">Enterprise PDF Platform with AI-Powered Features</p>
                    <div className="flex justify-center gap-8 text-sm">
                        <Link href="/tools" className="hover:text-white transition-colors">Tools</Link>
                        <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
                        <Link href="/api-docs" className="hover:text-white transition-colors">API</Link>
                        <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                        <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
                    </div>
                    <p className="mt-8 text-sm">© 2026 DocuForge. All rights reserved.</p>
                </div>
            </footer>
        </main>
    );
}
