import CustomFieldToggle from './CustomFieldToggle';
import NiceModal from '@ebay/nice-modal-react';
import {CustomField} from '@tryghost/admin-x-framework/api/customFields';
import {Icon, Modal, showToast} from '@tryghost/admin-x-design-system';
import {SocialLink} from '@tryghost/admin-x-framework/api/socialLinks';
import {useAddCustomField, useBrowseCustomFields} from '@tryghost/admin-x-framework/api/customFields';
import {useAddSocialLink, useBrowseSocialLinks} from '@tryghost/admin-x-framework/api/socialLinks';
import {useEffect, useRef, useState} from 'react';
import {useHandleError} from '@tryghost/admin-x-framework/hooks';
import {useRouting} from '@tryghost/admin-x-framework/routing';

const UserSettingsModal = NiceModal.create(() => {
    const modal = NiceModal.useModal();
    const customFieldsQuery = useBrowseCustomFields();
    const socialLinksQuery = useBrowseSocialLinks();
    const {mutateAsync: addCustomField} = useAddCustomField();
    const {mutateAsync: addSocialLink} = useAddSocialLink();

    const {updateRoute} = useRouting();

    const focusRef = useRef<HTMLInputElement>(null);
    const [saveState, setSaveState] = useState<'saving' | 'saved' | 'error' | ''>('');
    // const [errors, setErrors] = useState<{
    //     email?: string;
    //     role?: string;
    // }>({});

    const handleError = useHandleError();

    useEffect(() => {
        if (focusRef.current) {
            focusRef.current.focus();
        }
    }, []);

    useEffect(() => {
        if (saveState === 'saved') {
            setTimeout(() => {
                setSaveState('');
            }, 2000);
        }
    }, [saveState]);

    if (!customFieldsQuery.data?.fields) {
        return null;
    }

    if (!socialLinksQuery.data?.fields) {
        return null;
    }

    const handleSaveSettings = async () => {
        if (saveState === 'saving') {
            return;
        }

        setSaveState('saving');
        try {
            // Do shit

            setSaveState('saved');

            showToast({
                message: `Settings saved succesfully`,
                type: 'success'
            });

            modal.remove();
            updateRoute('staff');
        } catch (e) {
            setSaveState('error');

            showToast({
                message: `Failed to save settings`,
                type: 'error'
            });
            handleError(e, {withToast: false});
            return;
        }
    };

    return (
        <Modal
            afterClose={() => {
                updateRoute('staff');
            }}
            cancelLabel=''
            okLabel=''
            testId='user-settings-modal'
            title='Staff settings'
            width={540}
            onCancel={handleSaveSettings}
        >
            <div className='flex flex-col py-4'>
                <CustomFieldToggle
                    enabled={true}
                    isFirst={true}
                    name="Full name"
                    type="short"
                    toggleDisabled
                />

                <CustomFieldToggle
                    enabled={true}
                    name="Username"
                    type="short"
                    toggleDisabled
                />

                <CustomFieldToggle
                    enabled={true}
                    name="Email address"
                    type="short"
                    toggleDisabled
                />

                <CustomFieldToggle
                    enabled={true}
                    name="Title"
                    type="short"
                />

                <CustomFieldToggle
                    enabled={true}
                    name="Bio"
                    type="long"
                />
            </div>
            <div className='flex flex-col py-4'>
                <h3 className='pb-4'>Social Links</h3>
                {socialLinksQuery.data.fields.map((field: SocialLink, i: number) => {
                    return (
                        <CustomFieldToggle
                            enabled={field.enabled}
                            icon={field?.icon}
                            isFirst={i === 0}
                            name={field.name}
                            placeholder={field?.placeholder}
                            type="url"
                        />
                    );
                })}

                <div className='flex items-center'>
                    <div className='mr-1 flex min-h-11 min-w-11 items-center justify-center rounded bg-grey-150'>
                        <Icon colorClass='text-black' name='hyperlink-circle' size='sm' />
                    </div>
                    <div
                        className='flex min-h-11 w-full items-center justify-between rounded bg-grey-150 px-1'
                        onClick={async () => {
                            await addSocialLink({
                                name: 'New social link',
                                icon: new URL('https://static.cdninstagram.com/rsrc.php/v3/yX/r/7RzDLDb3SrS.png'),
                                placeholder: 'new social link placeholder'
                            });
                        }}
                    >
                        <p>Add new social network field</p>
                        <p className='text-md font-bold' onClick={() => {}}>+</p>
                    </div>
                </div>

            </div>
            <div className='flex flex-col py-4'>
                <h3 className='pb-4'>Custom Fields</h3>
                {customFieldsQuery.data.fields.map((field: CustomField, i: number) => {
                    return (
                        <CustomFieldToggle
                            enabled={field.enabled}
                            isFirst={i === 0}
                            name={field.name}
                            type={field.type}
                        />
                    );
                })}

                <div className='flex items-center'>
                    <div className='mr-1 flex min-h-11 min-w-11 items-center justify-center rounded bg-grey-150'>
                        <p className='black font-semibold'>Aa</p>
                    </div>
                    <div
                        className='flex min-h-11 w-full items-center justify-between rounded bg-grey-150 px-1'
                        onClick={async () => {
                            await addCustomField({
                                name: 'New field',
                                type: 'short'
                            });
                        }}
                    >
                        <p>Add new profile field</p>
                        <p className='text-md font-bold'>+</p>
                    </div>
                </div>
            </div>
        </Modal>
    );
});

export default UserSettingsModal;