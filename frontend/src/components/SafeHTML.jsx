import DOMPurify from 'dompurify';

/**
 * SafeHTML Component - Security Core
 * 
 * Goal: Render HTML content safely without XSS vulnerabilities.
 * Logic: Uses DOMPurify to strip <script>, <iframe>, and on* attributes.
 */
const SafeHTML = ({ html, className = "" }) => {
    // Sanitize the HTML content
    // ALLOWED_TAGS and ALLOWED_ATTR can be customized, but defaults are usually safe and sufficient
    const sanitizedHTML = DOMPurify.sanitize(html, {
        USE_PROFILES: { html: true }, // Ensure only HTML is allowed
        FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'link', 'style'], // Explicitly forbid dangerous tags
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'] // Explicitly forbid event handlers
    });

    return (
        <div
            className={`prose prose-invert max-w-none ${className}`}
            dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
        />
    );
};

export default SafeHTML;
