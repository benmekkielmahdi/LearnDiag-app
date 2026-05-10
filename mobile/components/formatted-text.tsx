import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface FormattedTextProps {
  text: string;
  isDark?: boolean;
}

export function FormattedText({ text, isDark }: FormattedTextProps) {
  if (!text) return null;

  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';

  const lines = text.split('\n');

  return (
    <View style={styles.container}>
      {lines.map((line, index) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return <View key={index} style={styles.spacer} />;

        const isBullet = trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ') || /^\d+\./.test(trimmedLine);
        
        // Remove bullet markers for styling
        let content = trimmedLine;
        if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
          content = trimmedLine.substring(2);
        }

        // Parse bold **text**
        const parts = content.split(/(\*\*.*?\*\*)/g);

        return (
          <View key={index} style={[styles.lineWrapper, isBullet && styles.bulletLine]}>
            {isBullet && (
              <Text style={[styles.bulletPoint, { color: '#3b82f6' }]}>• </Text>
            )}
            <Text style={[styles.text, { color: textColor }]}>
              {parts.map((part, j) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return (
                    <Text key={j} style={styles.boldText}>
                      {part.slice(2, -2)}
                    </Text>
                  );
                }
                return part;
              })}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  spacer: {
    height: 12,
  },
  lineWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  bulletLine: {
    paddingLeft: 4,
  },
  bulletPoint: {
    fontSize: 18,
    lineHeight: 24,
    marginRight: 4,
  },
  text: {
    fontSize: 15,
    lineHeight: 24,
    flex: 1,
  },
  boldText: {
    fontWeight: '900',
  },
});
